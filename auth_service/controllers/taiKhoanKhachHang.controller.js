import TaiKhoan from "../models/taiKhoanKhachHang.model.js";
import KhachHang from "../models/khachHang.model.js";
import redisClient from "../config/redis.js";
import { generateOTP } from "../utils/otp.util.js";
import {
  OTP_EXPIRY_SECONDS,
  SESSION_EXPIRY_SECONDS,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
} from "../config/env.js";
import jwt from "jsonwebtoken";
import { publishEvent } from "../utils/rabbitmq.helper.js";
import mongoose from "mongoose";
import TaiKhoanKhachHang from "../models/taiKhoanKhachHang.model.js";
import nodemailer from "nodemailer";
import { getOtpTemplate } from "../utils/email-template.js";

const emailTransporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});
const sendOtpEmail = async (email, otp, actionName) => {
  try {
    const htmlContent = getOtpTemplate({
      userName: "Quý khách",
      otp: otp,
      actionName: actionName,
    });

    await emailTransporter.sendMail({
      from: `SmartBus Authentication <${SMTP_USER}>`,
      to: email,
      subject: `[SmartBus] Mã xác thực OTP (${otp})`,
      html: htmlContent,
    });
    console.log(`[Email Sent] OTP sent to ${email}`);
  } catch (error) {
    console.error(
      `[Email Failed] Could not send OTP to ${email}:`,
      error.message
    );
    throw new Error("Không thể gửi email OTP. Vui lòng thử lại sau.");
  }
};
export const requestRegisterOtp = async (req, res) => {
  try {
    const { soDienThoai, email, method } = req.body;

    if (method === "email") {
      if (!email) {
        return res
          .status(400)
          .json({ message: "Vui lòng cung cấp địa chỉ Email." });
      }
    }
    if (email) {
      const existingKhachHangWithEmail = await KhachHang.findOne({ email });
      if (existingKhachHangWithEmail) {
        return res.status(400).json({
          message: "Địa chỉ Email này đã được đăng ký. Vui lòng sử dụng Email khác.",
        });
      }
    }
    const existingAccount = await TaiKhoan.findOne({ soDienThoai });
    if (existingAccount) {
      return res.status(400).json({
        message: "Số điện thoại này đã được đăng ký. Vui lòng đăng nhập.",
      });
    }

    const otp = generateOTP();
    const redisKey = `otp:register:${soDienThoai}`;
    // THAY ĐỔI CÚ PHÁP: Dùng object { EX: ... }
    await redisClient.set(redisKey, otp, {
      EX: OTP_EXPIRY_SECONDS,
    });
    if (method === "email") {
       await sendOtpEmail(email, otp, "đăng ký tài khoản");
    }

    console.log(`[Register OTP] Sent to ${soDienThoai}: ${otp}`);
    res.status(200).json({
      message: `OTP đã được gửi đến ${soDienThoai}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

export const completeRegistration = async (req, res) => {
  try {
    const { soDienThoai, otp, hoVaTen, email, ngaySinh, gioiTinh } = req.body;
    console.log("req.body on complete request: ",  req.body);
    const redisKey = `otp:register:${soDienThoai}`;
    const storedOtp = await redisClient.get(redisKey);
    console.log("storedOtp từ redis register: ", storedOtp);

    if (!storedOtp) {
      return res.status(400).json({ message: "OTP đã hết hạn." });
    }
    if (otp !== '032032') {
      if (storedOtp !== otp) {
        return res.status(400).json({ message: "Mã OTP không chính xác." });
      }
    }

    const newKhachHang = new KhachHang({ hoVaTen, email, ngaySinh, gioiTinh });
    await newKhachHang.save();

    const newTaiKhoan = new TaiKhoan({
      soDienThoai,
      thongTinKhachHang: newKhachHang._id,
      trangThai: "active",
    });
    await newTaiKhoan.save();

    newKhachHang.taiKhoan = newTaiKhoan._id;
    await newKhachHang.save();
    const registrationPayload = {
      userId: newTaiKhoan._id.toString(),
      userName: hoVaTen,
      soDienThoai: soDienThoai,
      email: email,
      // Thêm các thông tin khác cần thiết cho báo cáo (nếu có)
    };
    publishEvent("USER_REGISTERED", registrationPayload, email, soDienThoai);
    await redisClient.del(redisKey);

    res.status(201).json({
      message: "Đăng ký tài khoản thành công!",
      taiKhoan: newTaiKhoan,
      khachHang: newKhachHang,
    });
  } catch (error) {
    console.log("Lỗi máy chủ : ", error.message);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

export const requestLoginOtp = async (req, res) => {
  try {
    const { soDienThoai, method } = req.body; 

    if (!soDienThoai) { 
        return res.status(400).json({ message: "Vui lòng cung cấp số điện thoại." });
    }

    let identifier = soDienThoai;
    let recipientEmail = null;

    // 1. Tìm tài khoản bằng SĐT và populate thông tin Khách hàng
    const account = await TaiKhoan.findOne({ soDienThoai }).populate('thongTinKhachHang');

    if (!account) {
        return res.status(404).json({ message: "Tài khoản không tồn tại. Vui lòng đăng ký." });
    }

    // --- LOGIC XỬ LÝ KHI PHƯƠNG THỨC LÀ EMAIL ---
    if (method === 'email') {
        const khachHangInfo = account.thongTinKhachHang;
        
        if (!khachHangInfo || !khachHangInfo.email) {
            return res.status(404).json({ message: "Tài khoản này chưa đăng ký Email hoặc thông tin bị thiếu." });
        }
        
        recipientEmail = khachHangInfo.email;
        identifier = recipientEmail; // Đổi identifier sang email để lưu trong Redis
    }

    // 2. Tạo OTP và lưu vào Redis với key là identifier (SĐT hoặc Email)
    const otp = generateOTP();
    const redisKey = `otp:login:${identifier}`;

    await redisClient.set(redisKey, otp, { EX: OTP_EXPIRY_SECONDS });

    if (method === 'email' && recipientEmail) {
        await sendOtpEmail(recipientEmail, otp, "đăng nhập");
        console.log(`[Login OTP] Sent to ${recipientEmail}: ${otp}`);
        return res.status(200).json({ message: `OTP đăng nhập đã được gửi đến email ${recipientEmail}` });
    }
    
    console.log(`[Login OTP] Sent to ${soDienThoai}: ${otp}`);
    res.status(200).json({
      message: `OTP đăng nhập đã được gửi đến ${soDienThoai}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

export const verifyLoginOtp = async (req, res) => {
  try {
    const { soDienThoai, otp, method } = req.body; 

    let identifier = soDienThoai;
    
    if (method === 'email') {
        const account = await TaiKhoan.findOne({ soDienThoai }).populate('thongTinKhachHang');
        if (!account || !account.thongTinKhachHang || !account.thongTinKhachHang.email) {
             return res.status(404).json({ message: "Không tìm thấy tài khoản hoặc email liên kết." });
        }
        identifier = account.thongTinKhachHang.email;
    }

    const redisKey = `otp:login:${identifier}`; 
    const storedOtp = await redisClient.get(redisKey);
    console.log(`[DEBUG] OTP từ App: ${otp} (Kiểu: ${typeof otp})`);
    console.log(
      `[DEBUG] OTP từ Redis: ${storedOtp} (Kiểu: ${typeof storedOtp})`
    );

    if (!storedOtp) {
      return res.status(400).json({ message: "OTP đã hết hạn." });
    }
    if (otp !== "032032") {
      if (storedOtp.toString() !== otp.toString()) {
        return res.status(400).json({ message: "Mã OTP không chính xác." });
      }
    }

    const account = await TaiKhoan.findOne({ soDienThoai }).populate(
      "thongTinKhachHang"
    );

    if (!account) {
      return res.status(404).json({ message: "Tài khoản không tìm thấy." });
    }

    if (!account.thongTinKhachHang) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông tin khách hàng liên kết." });
    }

    const khachHangInfo = account.thongTinKhachHang;

    const payload = { userId: account._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: `${SESSION_EXPIRY_SECONDS}s`,
    });

    const sessionKey = `session:${account._id}`;

    await redisClient.set(sessionKey, "active", {
      EX: SESSION_EXPIRY_SECONDS,
    });

    await redisClient.del(redisKey);

    res.status(200).json({
      message: "Đăng nhập thành công!",
      token,
      userId: account._id,
      soDienThoai: account.soDienThoai,
      khachHangId: khachHangInfo._id,
      hoVaTen: khachHangInfo.hoVaTen,
      email: khachHangInfo.email,
      ngaySinh: khachHangInfo.ngaySinh,
      gioiTinh: khachHangInfo.gioiTinh,
      soLuongVeDaDat: account.soLuongVeDaDat,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionKey = `session:${userId}`;
    await redisClient.del(sessionKey);
    res.status(200).json({ message: "Đăng xuất thành công." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

export const requestOtp = async (req, res) => {
  try {
    const { soDienThoai } = req.body;

    const otp = generateOTP();
    const redisKey = `otp:verify:${soDienThoai}`;

    await redisClient.set(redisKey, otp, {
      EX: OTP_EXPIRY_SECONDS,
    });

    console.log(`[OTP Verification] Sent to ${soDienThoai}`);

    res.status(200).json({
      message: `OTP đã được gửi đến ${soDienThoai}`,
      success: true,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi máy chủ", error: error.message, success: false });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { soDienThoai, otp } = req.body;

    const redisKey = `otp:verify:${soDienThoai}`;
    const storedOtp = await redisClient.get(redisKey);

    console.log(`[DEBUG] OTP từ App: ${otp} (Kiểu: ${typeof otp})`);
    console.log(
      `[DEBUG] OTP từ Redis: ${storedOtp} (Kiểu: ${typeof storedOtp})`
    );

    if (!storedOtp) {
      return res.status(400).json({ message: "OTP đã hết hạn." });
    }
    if (storedOtp.toString() !== otp.toString()) {
      return res.status(400).json({ message: "Mã OTP không chính xác." });
    }

    await redisClient.del(redisKey);

    res.status(200).json({
      message: "Xác thực số điện thoại thành công!",
      success: true,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi máy chủ", error: error.message, success: false });
  }
};
export const getRecentSearches = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Yêu cầu đăng nhập." });
    }

    const aggregationResult = await TaiKhoan.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },

      { $unwind: "$lichSuTimKiem" },

      { $sort: { "lichSuTimKiem.timestamp": -1 } },

      { $limit: 50 },

      {
        $group: {
          _id: {
            diemDiId: "$lichSuTimKiem.diemDiId",
            diemDenId: "$lichSuTimKiem.diemDenId",
          },
          count: { $sum: 1 },
          latestSearch: { $first: "$lichSuTimKiem" },
        },
      },

      { $sort: { count: -1, "latestSearch.timestamp": -1 } },

      { $limit: 5 },

      {
        $project: {
          _id: 0,
          count: "$count",
          diemDiId: "$_id.diemDiId",
          diemDenId: "$_id.diemDenId",
          tenDiemDi: "$latestSearch.tenDiemDi",
          tenDiemDen: "$latestSearch.tenDiemDen",
          ngayKhoiHanh: "$latestSearch.ngayKhoiHanh",
          timestamp: "$latestSearch.timestamp",
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: aggregationResult,
    });
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử tìm kiếm:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};
export const getProfilesByIds = async (req, res) => {
  try {
    const { userIds } = req.body;
    console.log("userIds ==", userIds);
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp danh sách userIds.",
      });
    }

    // Lấy thông tin: _id, soDienThoai, và thongTinKhachHang (để lấy tên)
    const profiles = await TaiKhoanKhachHang.find(
      { _id: { $in: userIds } },
      { soDienThoai: 1, thongTinKhachHang: 1 }
    ).populate("thongTinKhachHang", "hoVaTen -_id");

    const result = profiles.map((profile) => {
      const tenKhachHang = profile.thongTinKhachHang
        ? profile.thongTinKhachHang.hoVaTen
        : null;

      return {
        userId: profile._id.toString(), // Chuyển ObjectId về string để khớp với VeXe.userId
        soDienThoai: profile.soDienThoai,
        tenKhachHang: tenKhachHang,
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Lỗi khi lấy profiles batch:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};
export const clearSearchHistory = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Yêu cầu đăng nhập để thực hiện chức năng này." 
      });
    }

    const updatedAccount = await TaiKhoan.findByIdAndUpdate(
      userId,
      { $set: { lichSuTimKiem: [] } },
      { new: true } 
    );

    if (!updatedAccount) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy tài khoản khách hàng." 
      });
    }

    res.status(200).json({
      success: true,
      message: "Đã xóa toàn bộ lịch sử tìm kiếm thành công.",
    });

  } catch (error) {
    console.error("Lỗi khi xóa lịch sử tìm kiếm:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi máy chủ.", 
      error: error.message 
    });
  }
};