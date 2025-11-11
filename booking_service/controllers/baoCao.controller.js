import VeXe from "../models/veXe.model.js";
import mongoose from "mongoose";

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