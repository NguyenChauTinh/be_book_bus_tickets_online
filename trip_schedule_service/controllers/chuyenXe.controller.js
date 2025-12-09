import ChuyenXe from "../models/chuyenXe.model.js";
import axios from "axios";

import {URL_BOOKING_SERVICE, GIAVE_API_URL} from "../config/env.js";
import { publishSearchHistoryEvent } from "../utils/rabbitmq.helper.js";
import DiaDiem from "../models/diaDiem.model.js";
import { getTuyenDuongByIdInternal } from "./tuyenDuong.controller.js";
export const createChuyenXeDonLe = async (req, res) => {
  try {
    const newTrip = new ChuyenXe(req.body);
    const savedTrip = await newTrip.save();
    res
      .status(201)
      .json({ message: "Đã tạo chuyến xe thành công.", data: savedTrip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDanhSachChuyenXe = async (req, res) => {
  try {
    const { tuyenDuong, ngayKhoiHanh } = req.query;
    const filter = {};
    if (tuyenDuong) filter.tuyenDuong = tuyenDuong;

    if (ngayKhoiHanh) {
      const startOfDay = new Date(ngayKhoiHanh);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(ngayKhoiHanh);
      endOfDay.setHours(23, 59, 59, 999);

      filter.ngayKhoiHanh = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    const trips = await ChuyenXe.find(filter);
    res.status(200).json({
      success: true,
      message: "Lấy chuyến xe thành công",
      data: trips,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Hàm mới: Lấy danh sách chuyến xe chỉ theo ngày khởi hành
export const getDanhSachChuyenXeTheoNgay = async (req, res) => {
  try {
    const { ngayKhoiHanh } = req.query;
    if (!ngayKhoiHanh) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng cung cấp ngày khởi hành." });
    }

    const startOfDay = new Date(ngayKhoiHanh);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(ngayKhoiHanh);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Bước 1: Lấy danh sách chuyến xe gốc
    const trips = await ChuyenXe.find({
      ngayKhoiHanh: { $gte: startOfDay, $lte: endOfDay },
    }).populate("loaiXe")
      .sort({ gioKhoiHanh: 1 })
      .lean();

    if (trips.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Bước 2: Lấy tất cả ID của các chuyến xe
    const tripIds = trips.map((trip) => trip._id.toString());

    let ticketCountsMap = {};
    try {
      // Bước 3: Gọi API đến service vé xe để lấy số lượng vé
      const response = await axios.post(
        `${URL_BOOKING_SERVICE}/api/v1/ve-xe/thong-ke/so-luong-theo-chuyen`,
        {
          chuyenXeIds: tripIds,
        }
      );
      if (response.data.success) {
        ticketCountsMap = response.data.data;
      }
    } catch (apiError) {
      console.error("Lỗi khi gọi đến Ticket Service:", apiError.message);
      // Không chặn chương trình nếu service vé lỗi, chỉ log lại
    }

    const tripsWithBookedCount = trips.map((trip) => ({
      ...trip,
      soVeDaDat: ticketCountsMap[trip._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      message: "Lấy danh sách chuyến xe thành công.",
      data: tripsWithBookedCount,
    });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách chuyến xe:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// --- Phần còn lại của Controller không thay đổi, nhưng tôi đã cập nhật getDanhSachChuyenXe để nó xử lý ngày tốt hơn ---

export const getChuyenXeByID = async (req, res) => {
  try {
    const trip = await ChuyenXe.findOne({ maChuyenXe: req.params.id }).populate(
      "loaiXe"
    );
    if (!trip) {
      return res.status(404).json({ message: "Không tìm thấy chuyến xe." });
    }

    res
      .status(200)
      .json({ success: true, message: "Lấy chuyến xe thành công", data: trip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getChuyenXeByObjId = async (req, res) => {
  try {
    console.log("ID chuyen xe == ", req.params.id);
    const trip = await ChuyenXe.findById(req.params.id).populate("loaiXe");
    if (!trip) {
      return res.status(404).json({ message: "Không tìm thấy chuyến xe." });
    }

    res.status(200).json({
      success: true,
      message: "Lấy chuyến xe thành công",
      data: trip,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTrangThaiChuyenXe = async (req, res) => {
  try {
    const { id } = req.params;
    const { trangThai } = req.body;
    const updateData = { trangThai };

    if (trangThai === "DA_XUAT_BEN") {
      const existingTrip = await ChuyenXe.findById(id);
      if (existingTrip && existingTrip.trangThai === "CHUA_XUAT_BEN") {
        updateData.thoiGianXuatBenThucTe = new Date();
      }
    } else if (trangThai === "HUY_CHUYEN") {
      updateData.thoiGianHuyChuyen = new Date();
    }

    const updatedTrip = await ChuyenXe.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(200).json({
      message: "Cập nhật trạng thái chuyến xe thành công.",
      data: updatedTrip,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateChuyenXe = async (req, res) => {
  try {
    const { id } = req.params;
    const { laiXe, phuXe, xe, trangThai, ghiChu } = req.body;

    const updateData = {};
    if (laiXe !== undefined) updateData.laiXe = laiXe;
    if (phuXe !== undefined) updateData.phuXe = phuXe;
    if (xe !== undefined) updateData.xe = xe;
    if (trangThai !== undefined) updateData.trangThai = trangThai;
    if (ghiChu !== undefined) updateData.ghiChu = ghiChu;

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "Không có dữ liệu hợp lệ để cập nhật." });
    }

    const updatedTrip = await ChuyenXe.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedTrip) {
      return res.status(404).json({ message: "Không tìm thấy chuyến xe." });
    }

    res.status(200).json({
      message: "Cập nhật chuyến xe thành công.",
      data: updatedTrip,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getDanhSachChuyenXeFilter = async (req, res) => {
  try {
    const { tuyenDuong, ngayBatDau, ngayKetThuc } = req.query;
    const filter = {};

    if (tuyenDuong) {
      filter.tuyenDuong = tuyenDuong;
    }

    if (ngayBatDau && ngayKetThuc) {
      const start = new Date(ngayBatDau);
      start.setHours(0, 0, 0, 0);
      const end = new Date(ngayKetThuc);
      end.setHours(23, 59, 59, 999);

      filter.ngayKhoiHanh = {
        $gte: start,
        $lte: end,
      };
    }

    const trips = await ChuyenXe.find(filter).sort({
      ngayKhoiHanh: 1,
      gioKhoiHanh: 1,
    });
    res.status(200).json({
      success: true,
      message: "Lấy chuyến xe thành công",
      data: trips,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getDanhSachChuyenXeTheoNgayVaDiaDiem = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { ngayKhoiHanh, diemDiId, diemDenId } = req.query;

    if (!ngayKhoiHanh) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng cung cấp ngày khởi hành." });
    }
    let tenDiemDi = null;
    let tenDiemDen = null;
    if (diemDiId) {
      const diemDi = await DiaDiem.findById(diemDiId)
        .select("tenDiaDiem")
        .lean();
      if (diemDi) tenDiemDi = diemDi.tenDiaDiem;
    }

    if (diemDenId) {
      const diemDen = await DiaDiem.findById(diemDenId)
        .select("tenDiaDiem")
        .lean();
      if (diemDen) tenDiemDen = diemDen.tenDiaDiem;
    }
    if (userId && ngayKhoiHanh && diemDiId && diemDenId) {
      const searchDetails = {
        diemDiId,
        diemDenId,
        ngayKhoiHanh,
        tenDiemDi: tenDiemDi || "Không rõ",
        tenDiemDen: tenDiemDen || "Không rõ",
      };
      publishSearchHistoryEvent(userId, searchDetails);
    }

    const startOfDay = new Date(ngayKhoiHanh);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(ngayKhoiHanh);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const trips = await ChuyenXe.find({
      ngayKhoiHanh: { $gte: startOfDay, $lte: endOfDay },
      trangThai: "CHUA_XUAT_BEN",
    })
      .populate("loaiXe", "maLoaiXe tenLoaiXe soDoGhe")
      .sort({ gioKhoiHanh: 1 })
      .lean();

    if (trips.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const enrichedTripsPromises = trips.map(async (trip) => {
      const soVeConLai = trip.soLuongVe || 0;
      
      let tuyenDuongData = trip.tuyenDuong;
      
      try {
        if (trip.tuyenDuong) {
          tuyenDuongData = await getTuyenDuongByIdInternal(trip.tuyenDuong);
        }
      } catch (error) {

      }
      return { ...trip, soVeConLai, tuyenDuong: tuyenDuongData };
    });

    const finalTripsData = await Promise.all(enrichedTripsPromises);

    // BƯỚC 4: Lọc chuyến xe theo điểm đi, điểm đến
    let filteredTrips = finalTripsData;
    if (diemDiId && diemDenId) {
      filteredTrips = finalTripsData.filter((trip) => {
        if (
          !trip.tuyenDuong ||
          typeof trip.tuyenDuong !== "object" ||
          !Array.isArray(trip.tuyenDuong.chiTietTuyen)
        )
          return false;
        const chiTiet = trip.tuyenDuong.chiTietTuyen;
        const diemDiIndex = chiTiet.findIndex(
          (d) => d.diaDiem?._id.toString() === diemDiId
        );
        const diemDenIndex = chiTiet.findIndex(
          (d) => d.diaDiem?._id.toString() === diemDenId
        );
        return (
          diemDiIndex > -1 && diemDenIndex > -1 && diemDiIndex < diemDenIndex
        );
      });
    }

    // BƯỚC 5 (MỚI): Gọi API để lấy giá vé cho từng chuyến xe đã lọc
    const tripsWithPricePromises = filteredTrips.map(async (trip) => {
      let price = "Liên hệ"; // Giá mặc định nếu không tìm thấy
      try {
        const params = {
          tuyenDuongId: trip.tuyenDuong?._id,
          loaiXeId: trip.loaiXe?._id,
          ngayHienTai: ngayKhoiHanh,
        };

        const priceResponse = await axios.get(GIAVE_API_URL, { params });

        if (priceResponse.data.success) {
          price = new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(priceResponse.data.soTienThanhToan);
        }
      } catch (error) {
        console.error(
          `Không tìm thấy giá vé cho chuyến ${trip.maChuyenXe}:`,
          error.message
        );
      }
      return { ...trip, price }; 
    });

    const tripsWithPrice = await Promise.all(tripsWithPricePromises);

    // BƯỚC 6: Biến đổi dữ liệu sang định dạng cuối cùng để hiển thị
    const formattedBusTrips = tripsWithPrice.map((trip) => {
      const hours = Math.floor(trip.tuyenDuong?.thoiGian / 60);
      const minutes = trip.tuyenDuong?.thoiGian % 60;
      const duration = `${hours}h ${minutes}p`;
      const seatsLeft = `${Math.max(
        0,
        (trip.soVeConLai || 0)
      )} chỗ trống`;

      const chiTiet = trip.tuyenDuong?.chiTietTuyen || [];
      const departureStation =
        chiTiet.find((d) => d.diaDiem?._id.toString() === diemDiId)?.diaDiem
          ?.tenDiaDiem ||
        chiTiet[0]?.diaDiem?.tenDiaDiem ||
        "N/A";
      const arrivalStation =
        chiTiet.find((d) => d.diaDiem?._id.toString() === diemDenId)?.diaDiem
          ?.tenDiaDiem ||
        chiTiet[chiTiet.length - 1]?.diaDiem?.tenDiaDiem ||
        "N/A";

      const totalMinutes = trip.gioKhoiHanh + (trip.tuyenDuong?.thoiGian || 0);
      const arrivalHours = Math.floor((totalMinutes % 1440) / 60);
      const arrivalMinutes = (totalMinutes % 1440) % 60;

      return {
        ...trip,
        id: trip._id,
        busType: trip.loaiXe?.tenLoaiXe,
        departureTime: `${String(Math.floor(trip.gioKhoiHanh / 60)).padStart(
          2,
          "0"
        )}:${String(trip.gioKhoiHanh % 60).padStart(2, "0")}`,
        arrivalTime: `${String(arrivalHours).padStart(2, "0")}:${String(
          arrivalMinutes
        ).padStart(2, "0")}`,
        duration,
        departureStation,
        arrivalStation,
        price: trip.price,
        price1: trip.price,
        seatsLeft,
      };
    });
    console.log("Final result: ", formattedBusTrips);
    res.status(200).json({
      success: true,
      message: "Lấy danh sách chuyến xe thành công.",
      data: formattedBusTrips,
    });
  } catch (err) {
    console.error("Lỗi khi lấy danh sách chuyến xe:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc [SỬA LỖI TIMEOUT] Lấy chi tiết nhiều chuyến xe bằng mảng ID.
 * Dùng .populate() đơn giản vì chúng ta đang ở đúng microservice.
 * @route POST /api/chuyen-xe/get-by-ids
 * @access Internal/User
 * @body { ids: ["id1", "id2", ...] }
 */
export const getMultipleChuyenXeByIds = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Thêm log debug phía backend
    console.log(`[Service ChuyenXe] Đang tìm ${ids.length} chuyến xe...`);

    // SỬA LỖI: Dùng .find() và .populate()
    // Code này sẽ giải quyết lỗi "N+1" mà không cần aggregate phức tạp
    const chuyenXeList = await ChuyenXe.find({ _id: { $in: ids } })
      .populate("xe") // "Join" với model Xe
      .populate("loaiXe") // "Join" với model LoaiXe
      .exec();

    console.log(
      `[Service ChuyenXe] Đã tìm thấy ${chuyenXeList.length} chuyến.`
    );

    // Luôn trả về một MẢNG
    res.status(200).json({ success: true, data: chuyenXeList });
  } catch (error) {
    // Lỗi 500 sẽ xảy ra ở đây
    console.error("Lỗi khi lấy nhiều chuyến xe (dùng .populate()):", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};
export const getChuyenXeTheoKhoangNgay = async (req, res) => {
  try {
    const { tuNgay, denNgay } = req.query;

    if (!tuNgay || !denNgay) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ 'tuNgay' và 'denNgay'.",
      });
    }

    const startDate = new Date(tuNgay);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(denNgay);
    endDate.setHours(23, 59, 59, 999);

    const trips = await ChuyenXe.find({
      ngayKhoiHanh: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .populate("loaiXe")
      .populate("xe")
      .sort({ ngayKhoiHanh: 1, gioKhoiHanh: 1 });

    res.status(200).json({
      success: true,
      message: `Tìm thấy ${trips.length} chuyến xe từ ${tuNgay} đến ${denNgay}`,
      data: trips,
    });
  } catch (err) {
    console.error("Lỗi tìm kiếm theo khoảng ngày:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
