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
