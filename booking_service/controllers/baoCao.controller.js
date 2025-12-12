import VeXe from "../models/veXe.model.js";
import mongoose from "mongoose";
import axios from "axios";
import { URL_AUTH_SERVICE } from "../config/env.js";

const runDoanhThuAggregation = async (req, res, customMatchStage) => {
    try {
        const { ngayBatDau, ngayKetThuc, chuyenXeIds } = req.body;
        const pageNum = parseInt(req.query.page) || 1;
        const limitNum = parseInt(req.query.limit) || 20;
        const skip = (pageNum - 1) * limitNum;

        // --- 1. Xây dựng Match Stage CƠ BẢN ---
        const baseMatchStage = {};

        if (ngayBatDau && ngayKetThuc) {
            const start = new Date(ngayBatDau);
            start.setHours(0, 0, 0, 0);
            const end = new Date(ngayKetThuc);
            end.setHours(23, 59, 59, 999);
            baseMatchStage["hoaDonInfo.createdAt"] = { $gte: start, $lte: end };
        }

        baseMatchStage["chiTiet.trangThaiChiTiet"] = { $ne: "DA_HUY" };
        baseMatchStage["hoaDonInfo.trangThai"] = "THANH_CONG";

        // Lọc theo chuyến xe (nếu có)
        if (chuyenXeIds && chuyenXeIds.length > 0) {
            baseMatchStage["chiTiet.chuyenXe"] = { $in: chuyenXeIds };
        }

        // --- 2. Kết hợp match cơ bản và match TÙY CHỈNH ---
        const finalMatchStage = {
            ...baseMatchStage,
            ...customMatchStage,
        };

        // --- 3. Chạy Aggregation ---
        const aggregationPipeline = [
            { $unwind: "$chiTiet" },
            {
                $lookup: {
                    from: "hoadons",
                    localField: "chiTiet.hoaDon",
                    foreignField: "_id",
                    as: "hoaDonInfo",
                },
            },
            { $unwind: "$hoaDonInfo" },
            { $match: finalMatchStage },
            {
                $facet: {
                    data: [
                        { $sort: { "hoaDonInfo.createdAt": -1 } },
                        { $skip: skip },
                        { $limit: limitNum },
                        {
                            $project: {
                                _id: "$chiTiet._id",
                                maVe: "$maVe",
                                maGhe: "$chiTiet.maChoNgoi",
                                nhanVien: "$hoaDonInfo.nhanVienTaoHoaDon",
                                donViThanhToan: "$hoaDonInfo.donViThanhToan",
                                ngayThu: "$hoaDonInfo.createdAt",
                                thu: "$chiTiet.giaVeCoBan",
                                phuThu: "$chiTiet.phuThu",
                                giamGia: "$chiTiet.giamGia",
                                tongTien: {
                                    $subtract: [
                                        { $add: ["$chiTiet.giaVeCoBan", "$chiTiet.phuThu"] },
                                        "$chiTiet.giamGia",
                                    ],
                                },
                                ngayChi: null,
                                chi: { $literal: 0 },
                                phiHuy: { $literal: 0 },
                            },
                        },
                    ],
                    metadata: [{ $count: "total" }],
                },
            },
        ];

        const result = await VeXe.aggregate(aggregationPipeline);

        const data = result[0].data;
        const total = result[0].metadata[0]?.total || 0;

        res.status(200).json({
            success: true,
            data: data,
            pagination: { total, page: pageNum, limit: limitNum },
        });
    } catch (error) {
        console.error("Lỗi khi lấy báo cáo doanh thu:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ: " + error.message });
    }
};


// 1. BÁO CÁO THEO NHÂN VIÊN
export const getBaoCaoDoanhThuNhanVien = async (req, res) => {
    const { danhSachIDs } = req.body;
    const customMatchStage = {};

    if (danhSachIDs && danhSachIDs.length > 0) {
        customMatchStage["hoaDonInfo.nhanVienTaoHoaDon"] = { $in: danhSachIDs };
    }else{
      if (danhSachIDs && danhSachIDs.length > 0) {
        customMatchStage["hoaDonInfo.nhanVienTaoHoaDon"] = { $ne: null };
    }
    }

    await runDoanhThuAggregation(req, res, customMatchStage);
};

// 2. BÁO CÁO THEO VĂN PHÒNG
export const getBaoCaoDoanhThuVanPhong = async (req, res) => {
    const { danhSachIDs } = req.body;
    const customMatchStage = {};

    if (danhSachIDs && danhSachIDs.length > 0) {
        customMatchStage["hoaDonInfo.donViThanhToan"] = { $in: danhSachIDs };
    } else {
        customMatchStage["hoaDonInfo.donViThanhToan"] = { $ne: null };
    }


    await runDoanhThuAggregation(req, res, customMatchStage);
};

// 3. BÁO CÁO THEO ĐẠI LÝ
export const getBaoCaoDoanhThuDaiLy = async (req, res) => {
    const { danhSachIDs } = req.body;
    const customMatchStage = {};

    if (danhSachIDs && danhSachIDs.length > 0) {
        customMatchStage["hoaDonInfo.donViThanhToan"] = { $in: danhSachIDs };
    } else {
        customMatchStage["hoaDonInfo.donViThanhToan"] = { $ne: null };
    }


    await runDoanhThuAggregation(req, res, customMatchStage);
};

// 4. BÁO CÁO THEO NGÂN HÀNG
export const getBaoCaoDoanhThuNganHang = async (req, res) => {
    const { danhSachIDs } = req.body;
    const customMatchStage = {};

    if (danhSachIDs && danhSachIDs.length > 0) {
        customMatchStage["hoaDonInfo.donViThanhToan"] = { $in: danhSachIDs };
    } else {
        customMatchStage["hoaDonInfo.donViThanhToan"] = { $ne: null };
    }

    await runDoanhThuAggregation(req, res, customMatchStage);
};


export const getCustomerStatsByPhone = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp fromDate và toDate.",
      });
    }

    const startDate = new Date(fromDate);
    const rawEndDate = new Date(toDate);

    const endDate = new Date(rawEndDate);
    endDate.setDate(rawEndDate.getDate() + 1);

    const stats = await VeXe.aggregate([
      // Bước 1: Lọc theo khoảng thời gian tạo vé
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          'chiTiet': { $ne: [] }
        }
      },
      // Bước 2: Tách mảng chiTiet để xử lý từng vé con (cần thiết để nhóm theo SĐT)
      { $unwind: "$chiTiet" },
      // Bước 3: Lọc bỏ chi tiết không có SĐT
      {
        $match: {
          "chiTiet.soDienThoai": { $exists: true, $ne: null }
        }
      },
      // Bước 4: Nhóm lại theo Số điện thoại
      {
        $group: {
          _id: "$chiTiet.soDienThoai",
          // Các chỉ số TÍNH TỪ CHI TIẾT VÉ
          tongSoVeDaDat: { $sum: 1 },
          soVeHuy: {
            $sum: {
              $cond: [{ $eq: ["$chiTiet.trangThaiChiTiet", "DA_HUY"] }, 1, 0]
            }
          },
          soVeDaThanhToan: {
            $sum: {
              $cond: [{ $eq: ["$chiTiet.trangThaiChiTiet", "DA_THANH_TOAN"] }, 1, 0]
            }
          },
          tongTienDat: { // Tổng tiền của tất cả chi tiết vé không hủy
            $sum: {
              $cond: [
                { $ne: ["$chiTiet.trangThaiChiTiet", "DA_HUY"] },
                { $subtract: [{ $sum: ["$chiTiet.giaVeCoBan", "$chiTiet.phuThu"] }, "$chiTiet.giamGia"] },
                0
              ]
            }
          },
          tongTienDaThanhToanChiTiet: { // Tổng tiền thanh toán (có hình thức thanh toán)
            $sum: {
                $cond: [
                    { $and: [
                        { $ne: ["$chiTiet.trangThaiChiTiet", "DA_HUY"] },
                        { $ne: ["$chiTiet.hinhThucThanhToan", null] }
                    ]},
                    { $subtract: [{ $sum: ["$chiTiet.giaVeCoBan", "$chiTiet.phuThu"] }, "$chiTiet.giamGia"] },
                    0
                ]
            }
          },
          
          // Thông tin bổ sung
          tenKhachHangGanNhat: { $first: "$chiTiet.tenKhachHang" },
          lanDatGanNhat: { $max: "$createdAt" },
        }
      },
      // Bước 5: Đổi tên trường và sắp xếp
      {
        $project: {
            _id: 0,
            soDienThoai: "$_id",
            tenKhachHang: "$tenKhachHangGanNhat",
            tongSoVeDaDat: 1,
            soVeHuy: 1,
            soVeDaThanhToan: 1,
            tongTienDat: 1, 
            tongTienDaThanhToan: "$tongTienDaThanhToanChiTiet",
            lanDatGanNhat: 1
        }
      },
      {
        $sort: { tongSoVeDaDat: -1, lanDatGanNhat: -1 }
      }
    ]);

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error("Lỗi khi thống kê khách hàng theo SĐT:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};



export const getCustomerStatsByUserId = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp fromDate và toDate.",
      });
    }

    const startDate = new Date(fromDate);
    
    const rawEndDate = new Date(toDate);

    const endDate = new Date(rawEndDate);
    endDate.setDate(rawEndDate.getDate() + 1);

    const stats = await VeXe.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          userId: { $exists: true, $ne: null }
        }
      },
      // Bước 2: Tách mảng chiTiet để tính toán số vé hủy/thanh toán/tổng đặt
      { $unwind: "$chiTiet" },
      
      // Bước 3: Nhóm lại theo userId (Lưu ý: Group ở đây sẽ tính lại tổng)
      {
        $group: {
          _id: "$userId",
          
          tongSoVeDaDat: { $sum: 1 },
          soVeHuy: {
            $sum: {
              $cond: [{ $eq: ["$chiTiet.trangThaiChiTiet", "DA_HUY"] }, 1, 0]
            }
          },
          soVeDaThanhToan: {
            $sum: {
              $cond: [{ $eq: ["$chiTiet.trangThaiChiTiet", "DA_THANH_TOAN"] }, 1, 0]
            }
          },
          
          // Tính lại tổng tiền (Đúng hơn là tổng tiền của tất cả chi tiết vé, kể cả vé hủy)
          tongTienDatToanBo: { 
            $sum: { $subtract: [{ $sum: ["$chiTiet.giaVeCoBan", "$chiTiet.phuThu"] }, "$chiTiet.giamGia"] }
          },
          // Tổng tiền thanh toán dựa trên chi tiết có hinhThucThanhToan (như hàm trên)
          tongTienDaThanhToanChiTiet: { 
            $sum: {
                $cond: [
                    { $and: [
                        { $ne: ["$chiTiet.trangThaiChiTiet", "DA_HUY"] },
                        { $ne: ["$chiTiet.hinhThucThanhToan", null] }
                    ]},
                    { $subtract: [{ $sum: ["$chiTiet.giaVeCoBan", "$chiTiet.phuThu"] }, "$chiTiet.giamGia"] },
                    0
                ]
            }
          },

          // Thông tin bổ sung
          lanDatGanNhat: { $max: "$createdAt" },
        }
      },
      // Bước 4: Đổi tên trường và sắp xếp
      {
        $project: {
            _id: 0,
            userId: "$_id",
            tongSoVeDaDat: 1,
            soVeHuy: 1,
            soVeDaThanhToan: 1,
            tongTienDat: "$tongTienDatToanBo", // Tổng tiền đặt (toàn bộ)
            tongTienDaThanhToan: "$tongTienDaThanhToanChiTiet",
            lanDatGanNhat: 1
        }
      },
      {
        $sort: { tongSoVeDaDat: -1, lanDatGanNhat: -1 }
      }
    ]);

    const userIds = stats.map(s => s.userId);
    const userProfiles = await fetchUserProfiles(userIds); 
    
    // Tạo Map để tra cứu nhanh thông tin profile
    const profileMap = new Map(userProfiles.map(p => [p.userId, p]));

    const finalStats = stats.map(s => {
        const profile = profileMap.get(s.userId);
        
        return {
            ...s,
            // Thêm thông tin Tên và SĐT vào kết quả thống kê
            tenKhachHang: profile?.tenKhachHang || "Khách hàng không xác định",
            soDienThoai: profile?.soDienThoai || "N/A"
        };
    });

    res.status(200).json({ success: true, data: finalStats });
  } catch (error) {
    console.error("Lỗi khi thống kê khách hàng theo userId:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};
const fetchUserProfiles = async (userIds) => {
    if (!userIds || userIds.length === 0) return []; 
    console.log("userIds fetch ==" , userIds, URL_AUTH_SERVICE)
    try {
        const response = await axios.post(
            `${URL_AUTH_SERVICE}/api/v1/tai-khoan-khach-hang/profiles/batch`,
            { userIds: userIds },
            // { headers: { 'X-Internal-Secret': process.env.INTERNAL_SECRET_KEY } }
        );

        if (response.data && response.data.success) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        // Log lỗi nhưng không làm crash service chính
        console.error("LỖI INTERNAL CALL: Không thể lấy profiles từ Auth Service:", error.message);
        return [];
    }
};