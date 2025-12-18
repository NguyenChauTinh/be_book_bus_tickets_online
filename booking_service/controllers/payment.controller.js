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
import { publishEvent } from "../utils/rabbitmq.helper.js";

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
        const firstDetail =
          veXe && veXe.chiTiet.length > 0 ? veXe.chiTiet[0] : null;
        try {
          const eventPayload = {
            bookingId: veXe ? veXe.maVe : "Unknown",
            amount: hoaDon.soTien,
            transactionId: hoaDon.maGiaoDichVNPAY,
            paymentTime: hoaDon.thoiGianThanhToan,
            paymentMethod: "VNPAY",
            customerName: firstDetail ? firstDetail.tenKhachHang : "Khách hàng",
            userId: veXe ? veXe.userId : null,
          };

          const phone = firstDetail ? firstDetail.soDienThoai : null;
          const email = veXe.email || null;

          // Gọi hàm publishEvent (đã import sẵn ở dòng 13 file gốc)
          publishEvent("PAYMENT_SUCCESSFUL", eventPayload, email, phone);
        } catch (rabbitmqError) {
          console.error("Lỗi khi bắn sự kiện thanh toán:", rabbitmqError);
          // Không chặn luồng chính
        }
        res.redirect(`https://nhaxe.smartbus.io.vn/payment-result?success=true&orderId=${orderId}`);
      } else {
        res.redirect(`https://nhaxe.smartbus.io.vn/payment-result?success=false&orderId=${orderId}`);
      }
    } else {
      res.redirect(`https://nhaxe.smartbus.io.vn/payment-result?success=false&message=${verify.message}`);
    }
  } catch (error) {
    res.redirect(`https://nhaxe.smartbus.io.vn/payment-result?success=false&message=Server+error`);
  }
};

export const createBookingAndPaymentUrl = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { chiTiet, nhanVienTao, amount, nhanVienId, userId, maGiamGia } =
      req.body;
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
      userId: userId || null,
      maGiamGia: maGiamGia || null,
      chiTiet: chiTiet.map((detail) => ({
        ...detail,
        nhanVienTao: nhanVienTao || null,
        maGiamGia: maGiamGia || null,
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
      return res.status(400).json({
        success: false,
        message: "Thiếu mã hóa đơn",
      });
    }

    const hoaDon = await HoaDon.findOne({ maHoaDon: maHoaDon }).populate(
      "veXe"
    );

    if (!hoaDon) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hóa đơn",
        code: 404,
      });
    }

    const ticketData = hoaDon.veXe;

    if (!ticketData) {
      return res.status(404).json({
        success: false,
        message: "Hóa đơn tồn tại nhưng không tìm thấy vé xe liên kết.",
        code: 404,
      });
    }

    res.status(200).json({
      success: true,
      code: 200,
      message: "Kiểm tra trạng thái thành công",
      trangThai: hoaDon.trangThai,
      maGiaoDichVNPAY: hoaDon.maGiaoDichVNPAY,
      data: ticketData,
    });
  } catch (error) {
    console.error("Check status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
      code: 500,
    });
  }
};
export const filterHoaDon = async (req, res) => {
  try {
    const {
      ngayBatDau,
      ngayKetThuc,
      trangThai,
      donViThanhToan,
      phuongThuc,
      sdt,
      page = 1,
      limit = 20,
    } = req.query;
    console.log("Query ds chuyển khoản : ", req.query);

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

    if (phuongThuc) {
      const methods = phuongThuc.split(",").map((m) => m.trim());
      matchStage.phuongThuc = { $in: methods };
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
