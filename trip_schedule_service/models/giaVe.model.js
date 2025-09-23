const mongoose = require("mongoose");

const GiaVeSchema = new mongoose.Schema(
  {
    maGiaVe: { type: String, required: true, unique: true }, // Mã giá vé
    tenGiaVe: { type: String, required: true }, // Tên giá vé
    tuanSuat: [{ type: String }], // Ví dụ: ["Thứ 2", "Thứ 6"]
    thoiGianBatDau: { type: Date, required: true },
    thoiGianKetThuc: { type: Date, required: true },
    ghiChu: { type: String },

    // Quan hệ 1-1 với tuyến đường
    tuyenDuong: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TuyenDuong",
      required: true,
    },

    // Quan hệ 1-1 với loại xe
    loaiXe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoaiXe",
      required: true,
    },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GiaVe", GiaVeSchema);

export default giaVe;
