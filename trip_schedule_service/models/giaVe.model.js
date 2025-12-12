import mongoose from "mongoose";

const chiTietGiaVeSchema = new mongoose.Schema(
  {
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
    
    soTienThanhToan: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  { _id: true }
);

const giaVeSchema = new mongoose.Schema(
  {
    maGiaVe: { type: String, required: true, unique: true },
    tenGiaVe: { type: String, required: true },
    tuanSuat: {
      type: String,
      enum: ["all", "weekdays"],
      required: true,
    },
    ngayApDung: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    thoiGianBatDau: { type: Date, required: true },
    thoiGianKetThuc: { type: Date, required: true },
    ghiChu: { type: String },
    active: { type: Boolean, default: true },
    chiTietGiaVe: [chiTietGiaVeSchema],
  },
  { timestamps: true }
);

export default mongoose.model("GiaVe", giaVeSchema);