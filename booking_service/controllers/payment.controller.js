import HoaDon from "../models/hoaDon.model.js";
import VeXe from "../models/veXe.model.js";
import {
  VNP_TMNCODE,
  VNP_HASHSECRET,
  VNP_URL,
  VNP_RETURN_URL,
  VNP_IPN_URL,
  FRONTEND_URL,
} from "../config/env.js";
import moment from "moment";
import mongoose from "mongoose";
import { VNPay } from "vnpay";
// const axios = require("axios");
// const crypto = require("crypto");
import querystring from "qs";
import axios from "axios";
import crypto from "crypto";

const vnpay = new VNPay({
  tmnCode: VNP_TMNCODE,
  secureSecret: VNP_HASHSECRET,
  returnUrl: VNP_RETURN_URL,
  ipnUrl: VNP_IPN_URL,
  hashAlgorithm: "SHA512",
  testMode: true,
});

const generateMaVe = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const length = Math.floor(Math.random() * 3) + 8;
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const createPaymentUrl = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { maVe, chiTietVeIds, amount, nhanVienId } = req.body;
    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    if (ipAddr === "::1" || ipAddr === "127.0.0.1") {
      ipAddr = "14.186.144.28";
    }

    await HoaDon.deleteMany({
      chiTietVeThanhToan: { $in: chiTietVeIds },
      trangThai: "CHO_THANH_TOAN",
      phuongThuc: "VNPAY",
    }).session(session);

    const veXe = await VeXe.findOne({ maVe });
    if (!veXe) {
      return res.status(404).json({ message: "Không tìm thấy vé xe." });
    }
    chiTietVeIds.forEach((id) => {
      const chiTiet = veXe.chiTiet.id(id);
      if (chiTiet) {
        chiTiet.hinhThucThanhToan = "VNPAY";
        chiTiet.trangThaiChiTiet = "DAT_CHO";
      }
    });
    await veXe.save({ session });
    const newHoaDon = new HoaDon({
      maHoaDon:
        moment().format("YYYYMMDDHHmmss") +
        Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0"),
      veXe: veXe._id,
      chiTietVeThanhToan: chiTietVeIds,
      soTien: amount,
      phuongThuc: "VNPAY",
      trangThai: "CHO_THANH_TOAN",
      nhanVienTaoHoaDon: nhanVienId || null,
      noiDungThanhToan: `Thanh toan ve xe ${maVe}`,
    });
    await newHoaDon.save({ session });

    chiTietVeIds.forEach((id) => {
      const chiTiet = veXe.chiTiet.id(id);
      if (chiTiet) {
        chiTiet.hoaDon = newHoaDon._id;
      }
    });
    await veXe.save({ session });

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: newHoaDon.maHoaDon,
      vnp_OrderInfo: newHoaDon.noiDungThanhToan,
      vnp_OrderType: "other",
      vnp_Locale: "vn",
      vnp_ReturnUrl: VNP_RETURN_URL,
      // vnp_IpnUrl: VNP_IPN_URL,
    });
    await session.commitTransaction();
    res.status(200).json({ paymentUrl, maHoaDon: newHoaDon.maHoaDon });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  } finally {
    session.endSession();
  }
};

export const vnpay_ipn = async (req, res) => {
  console.log("vnpay_ipn ..............");

  try {
    const query = req.query;

    const verify = vnpay.verifyIpnCall(query);

    if (!verify.isSuccess) {
      return res.status(200).json({ RspCode: "97", Message: "Fail checksum" });
    }

    const maHoaDon = query["vnp_TxnRef"];
    const rspCode = query["vnp_ResponseCode"];

    const hoaDon = await HoaDon.findOne({ maHoaDon: maHoaDon });
    if (!hoaDon) {
      return res
        .status(200)
        .json({ RspCode: "01", Message: "Order not found" });
    }
    if (hoaDon.trangThai !== "CHO_THANH_TOAN") {
      return res
        .status(200)
        .json({ RspCode: "02", Message: "Order already confirmed" });
    }

    if (rspCode === "00") {
      hoaDon.trangThai = "THANH_CONG";
      hoaDon.maGiaoDichVNPAY = query["vnp_TransactionNo"];
      hoaDon.maNganHangVNPAY = query["vnp_BankCode"];
      hoaDon.thoiGianThanhToan = moment(
        query["vnp_PayDate"],
        "YYYYMMDDHHmmss"
      ).toDate();
      hoaDon.vnpayResponseData = query;
      await hoaDon.save();

      const veXe = await VeXe.findById(hoaDon.veXe);
      if (veXe) {
        veXe.tongTienDaThanhToan += hoaDon.soTien;
        veXe.trangThaiThanhToan =
          veXe.tongTienDaThanhToan >= veXe.tongTien
            ? "DA_THANH_TOAN"
            : "THANH_TOAN_MOT_PHAN";
        hoaDon.chiTietVeThanhToan.forEach((idChiTiet) => {
          const chiTiet = veXe.chiTiet.id(idChiTiet);
          if (chiTiet) {
            chiTiet.trangThaiChiTiet = "DA_THANH_TOAN";
            chiTiet.hinhThucThanhToan = "VNPAY";
            chiTiet.hoaDon = hoaDon._id;
          }
        });
        await veXe.save();
      }
    } else {
      hoaDon.trangThai = "THAT_BAI";
      hoaDon.vnpayResponseData = query;
      await hoaDon.save();
    }

    res.status(200).json({ RspCode: "00", Message: "Success" });
  } catch (error) {
    res.status(200).json({ RspCode: "99", Message: "Unknown error" });
  }
};

export const vnpay_return = async (req, res) => {
  console.log("vnpay_return ..............");
  try {
    const query = req.query;
    const verify = vnpay.verifyReturnUrl(query);
    // console.log("verify == ", verify);

    const VNPAY_DON_VI_ID = "6908215f85eca99f9d2c8bd6";

    if (verify.isSuccess) {
      const rspCode = query["vnp_ResponseCode"];
      const orderId = query["vnp_TxnRef"];
      // console.log("Hoa don");
      const hoaDon = await HoaDon.findOne({ maHoaDon: orderId });
      if (!hoaDon) {
        return res
          .status(200)
          .json({ RspCode: "01", Message: "Order not found" });
      }
      if (hoaDon.trangThai !== "CHO_THANH_TOAN") {
        return res
          .status(200)
          .json({ RspCode: "02", Message: "Order already confirmed" });
      }

      const nhanVienId = hoaDon.nhanVienTaoHoaDon;

      hoaDon.donViThanhToan = VNPAY_DON_VI_ID;
      hoaDon.trangThai = "THANH_CONG";
      hoaDon.maGiaoDichVNPAY = query["vnp_TransactionNo"];
      hoaDon.maNganHangVNPAY = query["vnp_BankCode"];
      hoaDon.thoiGianThanhToan = moment(
        query["vnp_PayDate"],
        "YYYYMMDDHHmmss"
      ).toDate();
      hoaDon.vnpayResponseData = query;
      await hoaDon.save();

      const veXe = await VeXe.findById(hoaDon.veXe);
      if (veXe) {
        console.log("Ve xe");

        veXe.tongTienDaThanhToan += hoaDon.soTien;
        veXe.trangThaiThanhToan =
          veXe.tongTienDaThanhToan >= veXe.tongTien
            ? "DA_THANH_TOAN"
            : "THANH_TOAN_MOT_PHAN";

        hoaDon.chiTietVeThanhToan.forEach((idChiTiet) => {
          const chiTiet = veXe.chiTiet.id(idChiTiet);
          if (chiTiet) {
            chiTiet.trangThaiChiTiet = "DA_THANH_TOAN";
            chiTiet.hinhThucThanhToan = "VNPAY";
            chiTiet.hoaDon = hoaDon._id;
            chiTiet.nhanVienThuTien = nhanVienId;
            chiTiet.donViThanhToan = VNPAY_DON_VI_ID;
          }
        });
        await veXe.save();
      }

      if (rspCode === "00") {
        res.redirect(`${FRONTEND_URL}?success=true&orderId=${orderId}`);
      } else {
        res.redirect(`${FRONTEND_URL}?success=false&orderId=${orderId}`);
      }
    } else {
      res.redirect(`${FRONTEND_URL}?success=false&message=${verify.message}`);
    }
  } catch (error) {
    res.redirect(`${FRONTEND_URL}?success=false&message=Server+error`);
  }
};

export const createBookingAndPaymentUrl = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { chiTiet, nhanVienTao, amount, nhanVienId } = req.body;
    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    if (ipAddr === "::1" || ipAddr === "127.0.0.1") {
      ipAddr = "14.186.144.28";
    }

    if (!chiTiet || chiTiet.length === 0) {
      throw new Error("Thiếu thông tin chi tiết vé.");
    }

    const newTicket = new VeXe({
      maVe: generateMaVe(),
      chiTiet: chiTiet.map((detail) => ({
        ...detail,
        nhanVienTao: nhanVienTao || null,
        trangThaiChiTiet: "DAT_CHO",
        hinhThucThanhToan: "VNPAY",
        hoaDon: null,
      })),
      tongTien: amount,
      tongTienDaThanhToan: 0,
      trangThaiThanhToan: "CHUA_THANH_TOAN",
    });

    await newTicket.save({ session });

    const newHoaDon = new HoaDon({
      maHoaDon:
        moment().format("YYYYMMDDHHmmss") +
        Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0"),
      veXe: newTicket._id,
      chiTietVeThanhToan: newTicket.chiTiet.map((ct) => ct._id),
      soTien: amount,
      phuongThuc: "VNPAY",
      trangThai: "CHO_THANH_TOAN",
      nhanVienTaoHoaDon: nhanVienId || nhanVienTao || null,
      noiDungThanhToan: `Thanh toan ve xe ${newTicket.maVe}`,
    });

    await newHoaDon.save({ session });

    newTicket.chiTiet.forEach((ct) => {
      ct.hoaDon = newHoaDon._id;
    });
    await newTicket.save({ session });

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: newHoaDon.maHoaDon,
      vnp_OrderInfo: newHoaDon.noiDungThanhToan,
      vnp_OrderType: "other",
      vnp_Locale: "vn",
      vnp_ReturnUrl: VNP_RETURN_URL,
      // vnp_IpnUrl: VNP_IPN_URL,
    });

    await session.commitTransaction();

    res.status(200).json({ paymentUrl, maHoaDon: newHoaDon.maHoaDon });
  } catch (error) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "Lỗi server khi tạo thanh toán", error: error.message });
  } finally {
    session.endSession();
  }
};

export const checkPaymentStatus = async (req, res) => {
  try {
    const { maHoaDon } = req.query;
    if (!maHoaDon) {
      return res.status(400).json({ message: "Thiếu mã hóa đơn" });
    }

    const hoaDon = await HoaDon.findOne({ maHoaDon: maHoaDon }).select(
      "trangThai maGiaoDichVNPAY"
    );
    if (!hoaDon) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy hóa đơn", code: 400 });
    }

    res.status(200).json({
      trangThai: hoaDon.trangThai,
      maGiaoDichVNPAY: hoaDon.maGiaoDichVNPAY,
      message: "Thanh toán vé xe thành công",
      code: 200,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi server", error: error.message, code: 500 });
  }
};
export const filterHoaDon = async (req, res) => {
  try {
    const {
      ngayBatDau,
      ngayKetThuc,
      trangThai,
      donViThanhToan,
      sdt,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // --- 1. Giai đoạn $match chính (trên HoaDon) ---
    const matchStage = {};
    if (ngayBatDau && ngayKetThuc) {
      const start = new Date(ngayBatDau);
      start.setHours(0, 0, 0, 0);
      const end = new Date(ngayKetThuc);
      end.setHours(23, 59, 59, 999);
      matchStage.createdAt = { $gte: start, $lte: end };
    }
    if (trangThai) {
      matchStage.trangThai = trangThai;
    }
    if (donViThanhToan) {
      matchStage.donViThanhToan = donViThanhToan;
    }

    // --- 2. Giai đoạn $match phụ (sau khi $lookup VeXe) ---
    const postLookupMatchStage = {};
    if (sdt) {
      // Lọc sđt sau khi đã join VeXe
      postLookupMatchStage["veXeInfo.chiTiet.soDienThoai"] = new RegExp(
        sdt,
        "i"
      );
    }

    // --- 3. Pipeline gộp ---
    const aggregationPipeline = [
      { $match: matchStage },
      { $sort: { createdAt: -1 } }, // Sắp xếp theo ngày tạo mới nhất

      // Join với VeXe để lấy maVe và soDienThoai
      {
        $lookup: {
          from: "vexes",
          localField: "veXe",
          foreignField: "_id",
          as: "veXeInfo",
        },
      },
      { $unwind: { path: "$veXeInfo", preserveNullAndEmptyArrays: true } },

      // Lọc theo $match phụ
      { $match: postLookupMatchStage },

      // --- 4. Facet để Thống kê VÀ Phân trang ---
      {
        $facet: {
          // A. Dữ liệu phân trang
          data: [
            // Project các trường cần thiết cho bảng
            {
              $project: {
                _id: 1,
                maGiaoDichVNPAY: "$maGiaoDichVNPAY",
                maHoaDon: "$maHoaDon",
                maDonHang: "$veXeInfo.maVe",
                ngayKhoiTao: "$createdAt",
                phaiThu: "$soTien",
                ngayGhiNhan: "$updatedAt",
                trangThai: "$trangThai",
                phuongThuc: "$phuongThuc",
                soDienThoai: {
                  $arrayElemAt: ["$veXeInfo.chiTiet.soDienThoai", 0],
                },
              },
            },
            { $skip: skip },
            { $limit: limitNum },
          ],

          // B. Metadata (Tổng số)
          metadata: [{ $count: "total" }],

          // C. Stats (Top component)
          stats: [
            {
              $group: {
                _id: null,
                tongGiaoDich: { $sum: 1 },
                thanhCong: {
                  $sum: {
                    $cond: [{ $eq: ["$trangThai", "THANH_CONG"] }, 1, 0],
                  },
                },
                choThanhToan: {
                  $sum: {
                    $cond: [{ $eq: ["$trangThai", "CHO_THANH_TOAN"] }, 1, 0],
                  },
                },
                tongTienCho: {
                  $sum: {
                    $cond: [
                      { $eq: ["$trangThai", "CHO_THANH_TOAN"] },
                      "$soTien",
                      0,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ];

    const result = await HoaDon.aggregate(aggregationPipeline);

    const data = result[0].data;
    const total = result[0].metadata[0]?.total || 0;
    const stats = result[0].stats[0] || {
      tongGiaoDich: 0,
      thanhCong: 0,
      choThanhToan: 0,
      tongTienCho: 0,
    };

    res.status(200).json({
      success: true,
      data: data,
      pagination: { total, page: pageNum, limit: limitNum },
      stats: stats,
    });
  } catch (error) {
    console.error("Lỗi khi lọc hóa đơn:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

const config = {
  partnerCode: "MOMO",
  accessKey: "F8BBA842ECF85",
  secretKey: "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  endpoint: "https://test-payment.momo.vn/v2/gateway/api/create",
  // URL này sẽ được gọi khi thanh toán xong để App nhận biết
  redirectUrl: "http://192.168.1.21:3005/momo-return",
  // URL này MoMo gọi ngầm (Server-to-Server) để báo kết quả (Cần IP Public hoặc Ngrok)
  ipnUrl: "https://webhook.site/your-webhook-url",
};

export const createMoMoPayment = async (req, res) => {
  const { amount, orderInfo } = req.body;

  // Tạo mã đơn hàng ngẫu nhiên để không bị trùng trên hệ thống Test
  const orderId = config.partnerCode + new Date().getTime();
  const requestId = orderId;
  const requestType = "captureWallet";
  const extraData = ""; // Có thể để trống

  // --- TẠO CHỮ KÝ (SIGNATURE) ---
  // MoMo yêu cầu sắp xếp các trường theo thứ tự bảng chữ cái chính xác
  const rawSignature =
    `accessKey=${config.accessKey}` +
    `&amount=${amount}` +
    `&extraData=${extraData}` +
    `&ipnUrl=${config.ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${config.partnerCode}` +
    `&redirectUrl=${config.redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`;

  // Hash HMAC-SHA256
  const signature = crypto
    .createHmac("sha256", config.secretKey)
    .update(rawSignature)
    .digest("hex");

  // Tạo Body request
  const requestBody = {
    partnerCode: config.partnerCode,
    partnerName: "Test MoMo",
    storeId: "MomoTestStore",
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: config.redirectUrl,
    ipnUrl: config.ipnUrl,
    lang: "vi",
    requestType: requestType,
    autoCapture: true,
    extraData: extraData,
    signature: signature,
  };

  try {
    const response = await axios.post(config.endpoint, requestBody);

    console.log("MoMo Response:", response.data);

    if (response.data.resultCode === 0) {
      return res.status(200).json({
        paymentUrl: response.data.payUrl, // URL để mở WebView hoặc Browser
        deeplink: response.data.deeplink, // Link mở app MoMo trực tiếp (nếu cần)
        orderId: orderId,
      });
    } else {
      return res.status(400).json({ message: response.data.message });
    }
  } catch (error) {
    console.error("MoMo Error:", error);
    return res.status(500).json({ message: "Lỗi kết nối MoMo" });
  }
};

export const createVnPayUrl = (req, res) => {
  process.env.TZ = "Asia/Ho_Chi_Minh";
  const date = new Date();
  const createDate = moment(date).format("YYYYMMDDHHmmss");

  // 1. Lấy IP
  let ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  if (ipAddr && ipAddr.includes("::ffff:")) {
    ipAddr = ipAddr.split("::ffff:")[1];
  }
  if (!ipAddr) ipAddr = "127.0.0.1";

  // 2. Cấu hình
  const tmnCode = "24JHT453";
  const secretKey = "OGKDEJVAJHSZJLGVUIQYVMRYDJMICHIA";
  const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl = "http://192.168.1.21:3005/payment-return";

  const { amount, orderInfo } = req.body;

  // 3. Tạo tham số
  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = "vn";
  vnp_Params["vnp_CurrCode"] = "VND";
  vnp_Params["vnp_TxnRef"] = moment(date).format("DDHHmmss");
  vnp_Params["vnp_OrderInfo"] = orderInfo || "Thanh toan ve xe";
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = amount * 100;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;

  // 4. Sắp xếp tham số & Tạo chuỗi ký (Manual Build)
  // Bước này đảm bảo thứ tự a-z và encoding chuẩn từng byte
  vnp_Params = sortObject(vnp_Params);

  let signData = "";
  let i = 0;
  for (let key in vnp_Params) {
    if (i === 1) {
      signData += "&" + key + "=" + vnp_Params[key];
    } else {
      signData += key + "=" + vnp_Params[key];
      i = 1;
    }
  }

  // --- DEBUG LOG (Xem kỹ dòng này trong Terminal khi chạy) ---
  console.log("--------------- DEBUG VNPAY ---------------");
  console.log("1. SignData:", signData);
  // --------------------------------------------------------

  // 5. Ký (HMAC SHA512)
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  // 6. Tạo URL
  vnp_Params["vnp_SecureHash"] = signed;
  let finalUrl = vnpUrl + "?" + signData + "&vnp_SecureHash=" + signed;

  return res.status(200).json({
    status: "success",
    paymentUrl: finalUrl,
  });
};

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    // Thay thế khoảng trắng bằng dấu +
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
