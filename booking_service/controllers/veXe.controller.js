import { console } from "inspector";
import VeXe from "../models/veXe.model.js";
import HoaDon from "../models/hoaDon.model.js";
import mongoose from "mongoose";
import moment from "moment";
import Notification from "../models/notification.model.js";

/**
 * @desc Tạo mã vé ngẫu nhiên, không trùng lặp, dài 8-10 ký tự.
 * @returns {string} Mã vé mới, ví dụ: "VEX-A1B2C3D4"
 */
const generateMaVe = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const length = Math.floor(Math.random() * 3) + 8;
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const recalculateTongTien = (ticket) => {
  ticket.tongTien = ticket.chiTiet
    .filter((ct) => ct.trangThaiChiTiet !== "DA_HUY")
    .reduce(
      (sum, item) =>
        sum + (item.giaVeCoBan || 0) + (item.phuThu || 0) - (item.giamGia || 0),
      0
    );
};
const recalculateTongTienDaThanhToan = (ticket) => {
  ticket.tongTienDaThanhToan = ticket.chiTiet
    .filter((ct) => ct.hinhThucThanhToan && ct.trangThaiChiTiet !== "DA_HUY")
    .reduce(
      (sum, item) =>
        sum + (item.giaVeCoBan || 0) + (item.phuThu || 0) - (item.giamGia || 0),
      0
    );
};

/**
 * @desc [HÀM MỚI] Lấy thông tin chi tiết của một vé master bằng ID của nó.
 * @route GET /api/ve-xe/:ticketId
 * @access Admin
 * @params {String} ticketId - ID của vé master.
 */
export const getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID vé xe không hợp lệ." });
    }

    const ticket = await VeXe.findById(ticketId);
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy vé xe." });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    console.error("Lỗi khi lấy vé xe theo ID:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

/**
 * @desc Lấy danh sách vé master có chứa ít nhất một chi tiết vé thuộc về chuyến xe.
 */
export const getTicketsByChuyenXeId = async (req, res) => {
  try {
    const { chuyenXeId } = req.params;

    if (!chuyenXeId) {
      return res
        .status(400)
        .json({ success: false, message: "ID chuyến xe không được để trống." });
    }

    const tickets = await VeXe.aggregate([
      { $match: { "chiTiet.chuyenXe": chuyenXeId } },
      { $unwind: "$chiTiet" },
      {
        $match: {
          "chiTiet.chuyenXe": chuyenXeId,
          "chiTiet.trangThaiChiTiet": { $ne: "DA_HUY" },
        },
      },

      {
        $lookup: {
          from: "hoadons",
          localField: "chiTiet.hoaDon",
          foreignField: "_id",
          as: "hoaDonPopulated",
        },
      },
      {
        $addFields: {
          "chiTiet.hoaDon": { $arrayElemAt: ["$hoaDonPopulated", 0] },
        },
      },
      { $project: { hoaDonPopulated: 0 } },

      {
        $group: {
          _id: "$_id",
          maVe: { $first: "$maVe" },
          tongTien: { $first: "$tongTien" },
          tongTienDaThanhToan: { $first: "$tongTienDaThanhToan" },
          maGiamGia: { $first: "$maGiamGia" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          chiTiet: { $push: "$chiTiet" },
        },
      },
    ]);

    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách vé theo chuyến xe:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

/**
 * @desc Tạo một vé xe mới (vé master) với một hoặc nhiều chi tiết vé.
 * @route POST /api/ve-xe
 * @access Admin
 * @body { chuyenXe: "ID_chuyen_xe", chiTiet: [{ tenKhachHang: "...", soDienThoai: "...", maChoNgoi: "A1", ... }] }
 */
export const createTicket = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { chiTiet, maGiamGia, nhanVienTao, userId } = req.body;

    if (!chiTiet || chiTiet.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin chi tiết vé.",
        code: 400,
      });
    }

    const chiTietWithCreator = chiTiet.map((detail) => ({
      ...detail,
      nhanVienTao: nhanVienTao || null,
    }));

    const newTicket = new VeXe({
      maVe: generateMaVe(),
      maGiamGia: maGiamGia || null,
      userId: userId || null,
      chiTiet: chiTiet.map((detail) => ({
        ...detail,
        nhanVienTao: nhanVienTao || null,
        maGiamGia: maGiamGia || null,
      })),
    });
    const paidDetails = newTicket.chiTiet.filter((ct) => ct.hinhThucThanhToan);

    if (paidDetails.length > 0) {
      const initialPaymentAmount = paidDetails.reduce(
        (sum, item) =>
          sum +
          (item.giaVeCoBan || 0) +
          (item.phuThu || 0) -
          (item.giamGia || 0),
        0
      );

      if (initialPaymentAmount > 0) {
        const newHoaDon = new HoaDon({
          maHoaDon: moment().format("DDHHmmss"),
          veXe: newTicket._id,
          chiTietVeThanhToan: paidDetails.map((ct) => ct._id),
          soTien: initialPaymentAmount,
          donViThanhToan: paidDetails[0].donViThanhToan,
          phuongThuc:
            paidDetails[0].hinhThucThanhToan === "CHUYEN_KHOAN"
              ? "CHUYEN_KHOAN_MANUAL"
              : "TIEN_MAT",
          trangThai: "THANH_CONG",
          noiDungThanhToan: `Thanh toan khi dat ve ${newTicket.maVe}`,
          nhanVienTaoHoaDon: nhanVienTao
        });
        await newHoaDon.save({ session });

        paidDetails.forEach((ct) => {
          // Cập nhật lại link hóa đơn cho các chi tiết vé
          ct.hoaDon = newHoaDon._id;
        });
      }
    }

    recalculateTongTien(newTicket);
    recalculateTongTienDaThanhToan(newTicket);
    newTicket.trangThaiThanhToan =
      newTicket.tongTienDaThanhToan >= newTicket.tongTien &&
      newTicket.tongTien > 0
        ? "DA_THANH_TOAN"
        : newTicket.tongTienDaThanhToan > 0
        ? "THANH_TOAN_MOT_PHAN"
        : "CHUA_THANH_TOAN";
    const savedTicket = await newTicket.save({ session });
    await session.commitTransaction();

    try {
      if (req.io) {
        req.io.emit("new_booking", {
          maVe: savedTicket.maVe,
          khachHang: chiTiet[0].tenKhachHang, // Gửi một vài thông tin tóm tắt
          soLuong: chiTiet.length,
          tongTien: savedTicket.tongTien,
        });
      }
    } catch (socketError) {
      console.error("Lỗi khi bắn sự kiện socket:", socketError);
    }

    // Tạo thông báo cho người dùng nếu userId tồn tại
    try {
      if (userId) {
        const newNotification = new Notification({
          userId,
          title: "Đặt vé thành công",
          message: `Bạn đã đặt vé với mã ${savedTicket.maVe} thành công.`,
          type: "trip",
        });
        await newNotification.save();
      }
    } catch (notificationError) {
      console.error("Lỗi khi tạo thông báo:", notificationError);
    }

    res.status(201).json({
      success: true,
      message: "Tạo vé xe thành công.",
      data: savedTicket,
      code: 200,
    });
  } catch (error) {
    console.error("Lỗi khi tạo vé xe:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ: " + error.message,
      code: 400,
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc Tìm kiếm vé xe theo mã vé, tên khách hàng hoặc số điện thoại.
 * @route GET /api/ve-xe/tim-kiem
 * @access Admin
 * @query {String} query - Chuỗi tìm kiếm (tối thiểu 3 ký tự).
 */
export const searchTickets = async (req, res) => {
  try {
    const { query } = req.query;

    // ✅ Chỉ cần không rỗng là được
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập từ khóa tìm kiếm.",
      });
    }

    const searchRegex = new RegExp(query, "i");

    const tickets = await VeXe.find({
      $or: [
        { maVe: searchRegex },
        { "chiTiet.soDienThoai": searchRegex },
        { "chiTiet.tenKhachHang": searchRegex },
      ],
    })
      .limit(20)
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm vé xe:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

/**
 * @desc [NÂNG CẤP MỚI NHẤT] Cập nhật thông tin cho nhiều chi tiết vé.
 * Cho phép chỉnh sửa thông tin hành chính VÀ GIÁ VÉ.
 * Vẫn KHÔNG cho phép ghi nhận thanh toán qua hàm này.
 * @route PUT /api/ve-xe/:ticketId/details
 * @body { updatesList: [{ chiTietId: "...", updates: { tenKhachHang: "...", giaVeCoBan: 150000, ... } }] }
 */
export const updateMultipleTicketDetails = async (req, res) => {
  try {
    console.log("Đang gọi cập nhật vé");

    const { ticketId } = req.params;
    const { updatesList, maGiamGia } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(ticketId) ||
      !Array.isArray(updatesList) ||
      updatesList.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu cập nhật không hợp lệ.",
        code: 400,
      });
    }

    const ticket = await VeXe.findById(ticketId);
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy vé xe.", code: 400 });
    }
    if (maGiamGia !== undefined) {
      ticket.maGiamGia = maGiamGia;
    }

    const allowedUpdates = [
      "tenKhachHang",
      "soDienThoai",
      "diemDon",
      "diemTra",
      "diemDonTC",
      "diemTraTC",
      "ghiChu",
      "giaVeCoBan",
      "phuThu",
      "giamGia",
      "hinhThucThanhToan",
      "trangThaiChiTiet",
      "nhanVienThuTien",
      "donViThanhToan",
    ];

    let hasPriceChanged = false;
    let hasPaymentInfoChanged = false;

    for (const item of updatesList) {
      const { chiTietId, updates } = item;
      if (!chiTietId || !updates) continue;

      const chiTiet = ticket.chiTiet.id(chiTietId);
      if (chiTiet) {
        if (
          updates.trangThaiChiTiet === "DA_THANH_TOAN" &&
          updates.hinhThucThanhToan === "VNPAY"
        ) {
          updates.trangThaiChiTiet = "DAT_CHO";
        }

        Object.keys(updates).forEach((key) => {
          if (allowedUpdates.includes(key)) {
            chiTiet[key] = updates[key];
            if (["giaVeCoBan", "phuThu", "giamGia"].includes(key)) {
              hasPriceChanged = true;
            }
            if (["hinhThucThanhToan", "trangThaiChiTiet"].includes(key)) {
              hasPaymentInfoChanged = true;
            }
          }
        });
      }
    }

    // Nếu có bất kỳ thay đổi nào về giá, hãy tính toán lại tổng tiền của vé master
    if (hasPriceChanged) {
      recalculateTongTien(ticket);
    }

    await ticket.save();
    console.log("New ticket : ", ticket);
    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin chi tiết vé thành công 1.",
      data: ticket,
      code: 200,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật nhiều chi tiết vé:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ." + error.message,
      code: 400,
    });
  }
};

/**
 * @desc [HÀM MỚI] Hủy một hoặc nhiều chi tiết vé trong một vé master.
 * @route POST /api/ve-xe/:ticketId/details/batch-cancel
 * @access Admin
 * @body { chiTietIds: ["id1", "id2", ...] }
 */
export const cancelMultipleTicketDetails = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { chiTietIdsToCancel, reason } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(ticketId) ||
      !Array.isArray(chiTietIdsToCancel) ||
      chiTietIdsToCancel.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Dữ liệu đầu vào không hợp lệ." });
    }

    const ticket = await VeXe.findById(ticketId);
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy vé xe." });
    }

    let cancelledCount = 0;
    for (const detailId of chiTietIdsToCancel) {
      const chiTiet = ticket.chiTiet.id(detailId);
      if (chiTiet && chiTiet.trangThaiChiTiet !== "DA_HUY") {
        chiTiet.trangThaiChiTiet = "DA_HUY";
        chiTiet.lyDoHuy = reason || "Không rõ lý do";
        chiTiet.ngayHuy = new Date();
        cancelledCount++;
      }
    }

    if (cancelledCount > 0) {
      recalculateTongTien(ticket);
      await ticket.save();
    }

    try {
      // 2a. Gửi thông báo real-time đến Admin (Socket.IO)
      if (req.io) {
        req.io.emit("ticket_cancelled", {
          maVe: ticket.maVe,
          lyDo: reason,
          soLuongHuy: cancelledCount,
        });
      }

      // 2b. Lưu thông báo vào DB cho Người dùng (trên App)
      const userId = ticket.userId; // Lấy userId từ vé
      if (userId && cancelledCount > 0) {
        const newNotification = new Notification({
          userId: userId,
          title: "Hủy vé thành công",
          message: `Vé ${ticket.maVe} đã được hủy. Lý do: ${
            reason || "Không rõ lý do"
          }`,
          type: "trip",
        });
        await newNotification.save();
      }
    } catch (notifyError) {
      console.error("Lỗi khi tạo thông báo hủy vé:", notifyError);
      // Không làm gián đoạn response chính
    }

    res.status(200).json({
      success: true,
      message: `Hủy thành công ${cancelledCount} ghế.`,
      data: ticket,
      code: 200,
    });
  } catch (error) {
    console.error("Lỗi khi hủy nhiều chi tiết vé:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi máy chủ.", code: 500 });
  }
};

/**
 * @desc [NÂNG CẤP MỚI NHẤT] Tạo hóa đơn và ghi nhận thanh toán thủ công.
 * Đồng thời cập nhật lại giá vé nếu có thay đổi từ frontend.
 * @route POST /api/ve-xe/:ticketId/manual-invoice
 */
export const createManualInvoice = async (req, res) => {
  const {
    chiTietIds,
    phuongThuc,
    soTien,
    nhanVienThuTien,
    donViThanhToan,
    giaVeCoBan,
    phuThu,
    giamGia,
  } = req.body;
  const { ticketId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Hàm tạo hóa đơn và thanh toán vé xe đã tạo trước đó");

    if (
      !["TAI_VAN_PHONG", "DAI_LY", "CHUYEN_KHOAN", "KHONG_THU_TIEN"].includes(
        phuongThuc
      )
    ) {
      throw new Error(
        "Phương thức thanh toán thủ công không hợp lệ. VNPAY phải được xử lý qua QR."
      );
    }
    await HoaDon.deleteMany({
      chiTietVeThanhToan: { $in: chiTietIds },
      trangThai: "CHO_THANH_TOAN",
      phuongThuc: "VNPAY",
    }).session(session);

    const ticket = await VeXe.findById(ticketId).session(session);
    if (!ticket) {
      throw new Error("Không tìm thấy vé xe.");
    }

    for (const detailId of chiTietIds) {
      const chiTiet = ticket.chiTiet.id(detailId);
      if (chiTiet) {
        if (giaVeCoBan !== undefined) chiTiet.giaVeCoBan = giaVeCoBan;
        if (phuThu !== undefined) chiTiet.phuThu = phuThu;
        if (giamGia !== undefined) chiTiet.giamGia = giamGia;
      }
    }

    const newHoaDon = new HoaDon({
      maHoaDon: moment().format("DDHHmmss"),
      veXe: ticket._id,
      chiTietVeThanhToan: chiTietIds,
      soTien: soTien,
      phuongThuc: ["TAI_VAN_PHONG", "DAI_LY"].includes(phuongThuc)
        ? "TIEN_MAT"
        : phuongThuc === "CHUYEN_KHOAN"
        ? "CHUYEN_KHOAN_MANUAL"
        : phuongThuc,
      trangThai: "THANH_CONG",
      donViThanhToan: donViThanhToan,
      noiDungThanhToan: `Thanh toan bo sung cho ve ${ticket.maVe}`,
    });
    await newHoaDon.save({ session });

    for (const detailId of chiTietIds) {
      const chiTiet = ticket.chiTiet.id(detailId);
      if (chiTiet) {
        chiTiet.trangThaiChiTiet = "DA_THANH_TOAN";
        chiTiet.hinhThucThanhToan = phuongThuc;
        chiTiet.nhanVienThuTien = nhanVienThuTien;
        if (phuongThuc === "DAI_LY" || phuongThuc === "CHUYEN_KHOAN") {
          chiTiet.donViThanhToan = donViThanhToan;
        }
        chiTiet.hoaDon = newHoaDon._id;
      }
    }

    // TÍNH TOÁN LẠI SAU KHI ĐÃ CẬP NHẬT GIÁ
    recalculateTongTien(ticket);
    recalculateTongTienDaThanhToan(ticket);
    ticket.trangThaiThanhToan =
      ticket.tongTienDaThanhToan >= ticket.tongTien
        ? "DA_THANH_TOAN"
        : "THANH_TOAN_MOT_PHAN";

    await ticket.save({ session });
    await session.commitTransaction();
    res.status(200).json({
      code: 200,
      success: true,
      message: "Ghi nhận thanh toán thành công.",
      data: ticket,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({
      code: 400,
      success: false,
      message: "Thanh toán thất bại",
      errors: error.message,
    });
  } finally {
    session.endSession();
  }
};
/**
 * @desc Thêm một hoặc nhiều chi tiết vé (ghế) mới vào một vé master đã tồn tại.
 * @route POST /api/ve-xe/:ticketId/details
 * @access Admin
 * @params {String} ticketId - ID vé master.
 * @body { chiTiet: [{ tenKhachHang: "...", soDienThoai: "...", maChoNgoi: "B2", ... }] }
 */
export const addDetailToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    // CẬP NHẬT: Yêu cầu có `chuyenXe` cho các vé mới được thêm vào
    const { chuyenXe, chiTiet } = req.body;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID vé xe không hợp lệ." });
    }
    if (
      !chuyenXe ||
      !chiTiet ||
      !Array.isArray(chiTiet) ||
      chiTiet.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu chi tiết vé mới hoặc ID chuyến xe không hợp lệ.",
      });
      return res.status(400).json({
        success: false,
        message: "Dữ liệu chi tiết vé mới hoặc ID chuyến xe không hợp lệ.",
      });
    }

    const ticket = await VeXe.findById(ticketId);
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy vé xe." });
    }

    // CẬP NHẬT: Gán `chuyenXe` cho các chi tiết mới trước khi thêm
    const newChiTiet = chiTiet.map((detail) => ({
      ...detail,
      chuyenXe: chuyenXe,
    }));

    ticket.chiTiet.push(...newChiTiet);

    recalculateTongTien(ticket);

    await ticket.save();
    res.status(200).json({
      success: true,
      message: `Thêm ${chiTiet.length} ghế mới vào vé thành công.`,
      data: ticket,
    });
    res.status(200).json({
      success: true,
      message: `Thêm ${chiTiet.length} ghế mới vào vé thành công.`,
      data: ticket,
    });
  } catch (error) {
    console.error("Lỗi khi thêm chi tiết vé:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

/**
 * @desc [HÀM MỚI & NÂNG CẤP] Chuyển hoặc Hoán đổi (swap) chi tiết vé.
 * Tự động xử lý 2 trường hợp:
 * 1. Nếu ghế đích trống -> Chuyển vé (Move).
 * 2. Nếu ghế đích đã có người -> Hoán đổi thông tin 2 vé (Swap).
 * Hỗ trợ thao tác trong cùng một chuyến hoặc giữa các chuyến khác nhau.
 * @route PUT /api/ve-xe/details/unified-transfer-swap
 * @access Admin
 * @body { transfers: [{ chiTietId: "...", newChuyenXeId: "...", newSeatCode: "..." }] }
 */
export const unifiedTransferOrSwapDetails = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { transfers } = req.body;

    if (!transfers || !Array.isArray(transfers) || transfers.length === 0) {
      throw new Error("Dữ liệu không hợp lệ.");
    }

    const sourceChiTietIds = transfers.map((t) => t.chiTietId);

    // --- BƯỚC 1: LẤY TẤT CẢ CÁC VÉ LIÊN QUAN (CẢ NGUỒN VÀ ĐÍCH) ---

    // Build query để tìm các vé có thể là đích đến (target)
    const destinationChecks = transfers.map((t) => ({
      chiTiet: {
        $elemMatch: { chuyenXe: t.newChuyenXeId, maChoNgoi: t.newSeatCode },
      },
    }));

    // Lấy tất cả các vé master có chứa vé nguồn HOẶC vé đích
    const allInvolvedTickets = await VeXe.find({
      $or: [{ "chiTiet._id": { $in: sourceChiTietIds } }, ...destinationChecks],
    }).session(session);

    // --- BƯỚC 2: TẠO MAP ĐỂ DỄ DÀNG TRUY XUẤT DỮ LIỆU ---
    const detailMap = new Map(); // Map từ chiTietId -> chiTietObject
    const ticketOfDetailMap = new Map(); // Map từ chiTietId -> vé master chứa nó
    const seatToDetailMap = new Map(); // Map từ "chuyenXeId-maChoNgoi" -> chiTietObject

    allInvolvedTickets.forEach((ticket) => {
      ticket.chiTiet.forEach((detail) => {
        const detailIdStr = detail._id.toString();
        detailMap.set(detailIdStr, detail);
        ticketOfDetailMap.set(detailIdStr, ticket);

        const seatKey = `${detail.chuyenXe.toString()}-${detail.maChoNgoi}`;
        seatToDetailMap.set(seatKey, detail);
      });
    });

    // --- BƯỚC 3: XỬ LÝ TỪNG YÊU CẦU CHUYỂN/HOÁN ĐỔI ---
    for (const transfer of transfers) {
      const { chiTietId, newChuyenXeId, newSeatCode } = transfer;

      const sourceDetail = detailMap.get(chiTietId);
      if (!sourceDetail) {
        throw new Error(`Không tìm thấy vé nguồn với ID: ${chiTietId}`);
      }

      const targetSeatKey = `${newChuyenXeId}-${newSeatCode}`;
      const targetDetail = seatToDetailMap.get(targetSeatKey);

      if (targetDetail) {
        // TRƯỜNG HỢP 2: HOÁN ĐỔI (SWAP)
        if (targetDetail._id.equals(sourceDetail._id)) continue; // Bỏ qua nếu chuyển đến chính nó

        // Lưu lại thông tin gốc của vé nguồn
        const originalSourceChuyenXe = sourceDetail.chuyenXe;
        const originalSourceSeatCode = sourceDetail.maChoNgoi;

        // Cập nhật vé nguồn = thông tin của vé đích
        sourceDetail.chuyenXe = targetDetail.chuyenXe;
        sourceDetail.maChoNgoi = targetDetail.maChoNgoi;

        // Cập nhật vé đích = thông tin gốc của vé nguồn
        targetDetail.chuyenXe = originalSourceChuyenXe;
        targetDetail.maChoNgoi = originalSourceSeatCode;
      } else {
        // TRƯỜNG HỢP 1: CHUYỂN (MOVE) VÀO CHỖ TRỐNG
        sourceDetail.chuyenXe = newChuyenXeId;
        sourceDetail.maChoNgoi = newSeatCode;
      }
      sourceDetail.trangThaiChiTiet = "DA_CHUYEN";
    }

    // --- BƯỚC 4: LƯU TẤT CẢ CÁC VÉ ĐÃ THAY ĐỔI ---
    const uniqueTicketsToSave = new Set(ticketOfDetailMap.values());
    await Promise.all(
      Array.from(uniqueTicketsToSave).map((ticket) => ticket.save({ session }))
    );

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: "Thao tác chuyển/hoán đổi vé thành công.",
    });
    res.status(200).json({
      success: true,
      message: "Thao tác chuyển/hoán đổi vé thành công.",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Lỗi khi chuyển/hoán đổi vé:", error);
    res
      .status(400)
      .json({ success: false, message: error.message || "Lỗi máy chủ." });
  } finally {
    session.endSession();
  }
};
export const getTicketCountsForMultipleTrips = async (req, res) => {
  try {
    const { chuyenXeIds } = req.body;

    if (!Array.isArray(chuyenXeIds) || chuyenXeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "chuyenXeIds phải là một mảng và không được rỗng.",
      });
    }

    // Sử dụng aggregation để đếm hiệu quả
    const counts = await VeXe.aggregate([
      // Giai đoạn 1: "Mở" mảng chiTiet ra để xử lý từng vé con
      { $unwind: "$chiTiet" },

      // Giai đoạn 2: Lọc ra các vé con thuộc danh sách chuyến xe và không bị hủy
      {
        $match: {
          "chiTiet.chuyenXe": { $in: chuyenXeIds },
          "chiTiet.trangThaiChiTiet": { $ne: "DA_HUY" },
        },
      },

      // Giai đoạn 3: Gom nhóm theo chuyenXe và đếm số lượng
      {
        $group: {
          _id: "$chiTiet.chuyenXe", // Gom nhóm theo ID chuyến xe
          count: { $sum: 1 }, // Đếm số lượng document trong mỗi nhóm
        },
      },
    ]);

    // Chuyển kết quả từ mảng [{ _id, count }] thành object { chuyenXeId: count }
    const countsMap = counts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.status(200).json({ success: true, data: countsMap });
  } catch (error) {
    console.error("Lỗi khi lấy số lượng vé cho nhiều chuyến:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};
export const getCancelledTicketsByChuyenXeId = async (req, res) => {
  try {
    const { chuyenXeId } = req.params;

    if (!chuyenXeId) {
      return res
        .status(400)
        .json({ success: false, message: "ID chuyến xe không được để trống." });
    }

    const cancelledTickets = await VeXe.aggregate([
      {
        $match: {
          "chiTiet.chuyenXe": chuyenXeId,
          "chiTiet.trangThaiChiTiet": "DA_HUY",
        },
      },
      {
        $unwind: "$chiTiet",
      },
      {
        $match: {
          "chiTiet.chuyenXe": chuyenXeId,
          "chiTiet.trangThaiChiTiet": "DA_HUY",
        },
      },
      {
        $group: {
          _id: "$_id",
          maVe: { $first: "$maVe" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          chiTiet: { $push: "$chiTiet" }, // Đẩy các chi tiết đã hủy vào lại mảng
        },
      },
    ]);

    res.status(200).json({ success: true, data: cancelledTickets });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách vé đã hủy:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

export const getTicketsByChuyenXeList = async (req, res) => {
  try {
    const { chuyenXeIds } = req.body;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sdt = req.query.sdt;
    const ten = req.query.ten;
    const ghe = req.query.ghe;

    const skip = (page - 1) * limit;

    if (!chuyenXeIds || chuyenXeIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { total: 0, page, limit },
      });
    }
    const matchStage = {
      "chiTiet.chuyenXe": { $in: chuyenXeIds }, //
    };
    if (sdt) {
      matchStage["chiTiet.soDienThoai"] = new RegExp(sdt, "i"); //
    }
    if (ten) {
      matchStage["chiTiet.tenKhachHang"] = new RegExp(ten, "i"); //
    }
    if (ghe) {
      matchStage["chiTiet.maChoNgoi"] = new RegExp(ghe, "i"); //
    }

    const aggregationResult = await VeXe.aggregate([
      { $unwind: "$chiTiet" },
      { $match: matchStage }, // 3. Áp dụng $match đã cập nhật
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            { $project: { _id: "$chiTiet._id", chiTiet: "$chiTiet" } },
          ],
          metadata: [{ $count: "total" }],
        },
      },
    ]);

    const data = aggregationResult[0].data.map((item) => item.chiTiet);
    const total = aggregationResult[0].metadata[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: data,
      pagination: { total, page, limit },
      code: 200,
    });
  } catch (error) {
    console.error("Lỗi khi lọc vé xe:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

export const filterVeXeMaster = async (req, res) => {
  try {
    const { chuyenXeIds } = req.body;
    const { page = 1, limit = 20, sdt, ten, ghe } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // --- 1. Xây dựng $match stage ---
    // Tìm các VeXe có chiTiet phù hợp
    const matchStage = {};
    const elemMatchFilters = {};

    if (chuyenXeIds && chuyenXeIds.length > 0) {
      elemMatchFilters.chuyenXe = { $in: chuyenXeIds };
    }
    if (sdt) {
      elemMatchFilters.soDienThoai = new RegExp(sdt, "i");
    }
    if (ten) {
      elemMatchFilters.tenKhachHang = new RegExp(ten, "i");
    }
    if (ghe) {
      elemMatchFilters.maChoNgoi = new RegExp(ghe, "i");
    }

    // Chỉ tìm kiếm nếu có ít nhất 1 filter
    if (Object.keys(elemMatchFilters).length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: { total: 0, page: pageNum, limit: limitNum },
      });
    }

    matchStage.chiTiet = { $elemMatch: elemMatchFilters };

    // --- 2. Aggregation Pipeline ---
    const aggregationResult = await VeXe.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          // A. Dữ liệu (Đã phân trang và lookup Hóa đơn)
          data: [
            { $skip: skip },
            { $limit: limitNum },
            // Populate chiTiet.hoaDon để hiển thị trong modal
            { $unwind: "$chiTiet" },
            {
              $lookup: {
                from: "hoadons",
                localField: "chiTiet.hoaDon",
                foreignField: "_id",
                as: "hoaDonInfo",
              },
            },
            {
              $addFields: {
                "chiTiet.hoaDon": { $arrayElemAt: ["$hoaDonInfo", 0] },
              },
            },
            {
              $group: {
                _id: "$_id",
                maVe: { $first: "$maVe" },
                tongTien: { $first: "$tongTien" },
                tongTienDaThanhToan: { $first: "$tongTienDaThanhToan" },
                maGiamGia: { $first: "$maGiamGia" },
                trangThaiThanhToan: { $first: "$trangThaiThanhToan" },
                createdAt: { $first: "$createdAt" },
                chiTiet: { $push: "$chiTiet" },
              },
            },
            { $sort: { createdAt: -1 } },
          ],
          metadata: [{ $count: "total" }],
        },
      },
    ]);

    const data = aggregationResult[0].data;
    const total = aggregationResult[0].metadata[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: data,
      pagination: { total, page: pageNum, limit: limitNum },
      code: 200,
    });
  } catch (error) {
    console.error("Lỗi khi lọc vé xe master:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

/**
 * @desc [SỬA LỖI MICROSERVICE] Lấy tất cả vé xe của user.
 * KHÔNG populate, vì ChuyenXe nằm ở service khác.
 * @route GET /api/ve-xe/user/:userId
 * @access User/Admin
 * @params {String} userId - ID của user.
 */
export const getTicketsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "ID người dùng không được để trống.",
      });
    }

    // Chỉ dùng .find() đơn giản. Không được .populate()
    const tickets = await VeXe.find({ userId: userId })
      .sort({ createdAt: -1 })
      .exec();

    // API này sẽ chỉ trả về vé và ID của chuyến xe (chuyenXeId)
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    console.error("Lỗi khi lấy vé xe theo userId:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};
