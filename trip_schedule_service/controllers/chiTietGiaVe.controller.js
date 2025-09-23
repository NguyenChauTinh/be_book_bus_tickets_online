import chiTietGiaVe from "../models/chiTietGiaVe.model.js";

export const createChiTietGiaVe = async (req, res, next) => {
  try {
    const { maChiTiet, soTienThanhToan, ghiChu, giaVe } = req.body;
    const existingChiTietGiaVe = await chiTietGiaVe.findOne({ maChiTiet });
    if (existingChiTietGiaVe) {
      const error = new Error("Mã chi tiết giá vé đã tồn tại");
      error.statusCode = 409;
      throw error;
    }
    const newChiTietGiaVe = await chiTietGiaVe.create([
      {
        maChiTiet,
        soTienThanhToan,
        ghiChu,
        giaVe,
      },
    ]);
    res.status(201).json({
      status: "success",
      message: "Chi tiết giá vé created successfully",
      data: {
        chiTietGiaVe: newChiTietGiaVe,
      },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllChiTietGiaVe = async (req, res) => {
  const list = await chiTietGiaVe.find().populate("giaVe");
  res.json(list);
};

export const getChiTietGiaVeById = async (req, res) => {
  const { id } = req.params;
  const chiTiet = await chiTietGiaVe.findById(id).populate("giaVe");
  if (!chiTiet) {
    return res.status(404).json({ message: "Chi tiết giá vé không tồn tại" });
  }
  res.json(chiTiet);
};
export const updateChiTietGiaVe = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { maChiTiet, soTienThanhToan, ghiChu, giaVe } = req.body;
    const chiTiet = await chiTietGiaVe.findById(id);
    if (!chiTiet) {
      const error = new Error("Chi tiết giá vé không tồn tại");
      error.statusCode = 404;
      throw error;
    }
    chiTiet.maChiTiet = maChiTiet || chiTiet.maChiTiet;
    chiTiet.soTienThanhToan = soTienThanhToan || chiTiet.soTienThanhToan;
    chiTiet.ghiChu = ghiChu || chiTiet.ghiChu;
    chiTiet.giaVe = giaVe || chiTiet.giaVe;
    await chiTiet.save();
    res.status(200).json({
      status: "success",
      message: "Chi tiết giá vé updated successfully",
      data: {
        chiTietGiaVe: chiTiet,
      },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteChiTietGiaVe = async (req, res, next) => {
  try {
    const { id } = req.params;
    const chiTiet = await chiTietGiaVe.findById(id);
    if (!chiTiet) {
      const error = new Error("Chi tiết giá vé không tồn tại");
      error.statusCode = 404;
      throw error;
    }
    await chiTiet.remove();
    res.status(200).json({
      status: "success",
      message: "Chi tiết giá vé deleted successfully",
      data: {
        chiTietGiaVe: chiTiet,
      },
      // data: { chiTietGiaVe },
      // message: "Chi tiết giá vé deleted successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
