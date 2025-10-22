import mongoose from "mongoose";

const ChuyenXeSchema = new mongoose.Schema(
  {
    maChuyenXe: {
      type: String,
      required: true,
      trim: true,
    },
    maLichChay: {
      type: String,
      default: null,
    },
    maLine: {
      type: String,
      default: null,
    },
    tuyenDuong: {
      type: String,
      required: true,
    },
    ngayKhoiHanh: {
      type: Date,
      required: true,
    },
    gioKhoiHanh: { type: Number, required: true },
    loaiXe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LoaiXe",
      required: true,
    },
    loaiDichVu: {
      type: String,
      enum: ["TUYEN_CO_DINH", "XE_HOP_DONG"],
      required: true,
    },
    xe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Xe",
      default: null,
    },
    laiXe: {
      type: String,
      default: null,
    },
    phuXe: {
      type: String,
      default: null,
    },
    ghiChu: {
      type: String,
    },
    sotai: {
      type: String,
    },
    trangThai: {
      type: String,
      enum: ["CHUA_XUAT_BEN", "DA_XUAT_BEN", "HUY_CHUYEN"],
      default: "CHUA_XUAT_BEN",
    },
    thoiGianXuatBenThucTe: {
      type: Date,
      default: null,
    },
    thoiGianHuyChuyen: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const ChuyenXe = mongoose.model("ChuyenXe", ChuyenXeSchema);

export default ChuyenXe;
