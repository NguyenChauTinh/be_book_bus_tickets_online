// models/giaVe.model.js
import mongoose from "mongoose";

// Schema con: Chi tiết giá vé
const chiTietGiaVeSchema = new mongoose.Schema(
  {
    diemDi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChiTietTuyenDuong",
      required: true,
    },
    diemDen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChiTietTuyenDuong",
      required: true,
    },
    soTienThanhToan: { type: Number, required: true },
  },
  { _id: true } // để mỗi chi tiết có id riêng trong mảng
);

// Schema chính: Giá vé
const giaVeSchema = new mongoose.Schema(
  {
    maGiaVe: { type: String, required: true, unique: true },
    tenGiaVe: { type: String, required: true },
    tuanSuat: {
      type: String,
      enum: ["all", "weekdays", "oddEven", "specific"],
      required: true,
    },
    ngayApDung: [{ type: String }], // mảng ngày áp dụng
    thoiGianBatDau: { type: Date, required: true },
    thoiGianKetThuc: { type: Date, required: true },
    ghiChu: { type: String },

    tuyenDuong: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TuyenDuong",
      required: true,
    },
    loaiXe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoaiXe",
      required: true,
    },

    active: { type: Boolean, default: true },

    chiTietGiaVe: [chiTietGiaVeSchema], // mảng embed
  },
  { timestamps: true }
);

export default mongoose.model("GiaVe", giaVeSchema);
