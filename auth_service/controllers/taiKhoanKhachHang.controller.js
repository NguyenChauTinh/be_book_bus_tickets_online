import TaiKhoan from "../models/taiKhoanKhachHang.model.js";
import KhachHang from "../models/khachHang.model.js";
import redisClient from "../config/redis.js";
import { generateOTP } from "../utils/otp.util.js";
import {
  OTP_EXPIRY_SECONDS,
  SESSION_EXPIRY_SECONDS,

} from "../config/env.js";
import jwt from "jsonwebtoken";
import { publishEvent } from "../utils/rabbitmq.helper.js";

export const requestRegisterOtp = async (req, res) => {
  try {
    const { soDienThoai } = req.body;
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

    const redisKey = `otp:register:${soDienThoai}`;
    const storedOtp = await redisClient.get(redisKey);

    if (!storedOtp) {
      return res.status(400).json({ message: "OTP đã hết hạn." });
    }
    if (storedOtp !== otp) {
      return res.status(400).json({ message: "Mã OTP không chính xác." });
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
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

export const requestLoginOtp = async (req, res) => {
  try {
    const { soDienThoai } = req.body;
    const account = await TaiKhoan.findOne({ soDienThoai });
    if (!account) {
      return res.status(404).json({
        message: "Tài khoản không tồn tại. Vui lòng đăng ký.",
      });
    }

    const otp = generateOTP();
    const redisKey = `otp:login:${soDienThoai}`;

    // THAY ĐỔI CÚ PHÁP
    await redisClient.set(redisKey, otp, {
      EX: OTP_EXPIRY_SECONDS,
    });


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
    const { soDienThoai, otp } = req.body;

    const redisKey = `otp:login:${soDienThoai}`;
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
