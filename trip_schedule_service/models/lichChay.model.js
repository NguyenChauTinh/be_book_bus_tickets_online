import mongoose from "mongoose";

const TanSuatSchema = new mongoose.Schema({
  loaiTanSuat: {
    type: String,
    enum: [
      "HANG_NGAY",
      "THEO_THU_TRONG_TUAN",
      "THEO_NGAY_LE_CHAN",
      "THEO_NGAY_CU_THE",
    ],
    default: "HANG_NGAY",
  },
  giaTri: {
    type: mongoose.Schema.Types.Mixed,
  },
});

const LichChayChiTietSchema = new mongoose.Schema({
  maLine: {
    type: String,
    required: true,
    trim: true,
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
  tanSuat: {
    type: TanSuatSchema,
    required: true,
  },
  laiXe: {
    type: String,
    default: null,
  },
  phuXe: {
    type: String,
    default: null,
  },
  active: {
    type: Boolean,
    default: true,
  },
  ghiChu: {
    type: String,
  },
  soLuongVe: {
    type: Number,
    default: 0,
  },
});

const LichChayMasterSchema = new mongoose.Schema(
  {
    maLichChay: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    tenLichChay: {
      type: String,
      required: true,
    },
    tuyenDuong: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TuyenDuong",
      required: true,
    },
    ngayBatDau: {
      type: Date,
      required: true,
    },
    ngayKetThuc: {
      type: Date,
      required: true,
    },
    ghiChu: {
      type: String,
    },
    trangThai: {
      type: Boolean,
      default: true,
    },
    lines: {
      type: [LichChayChiTietSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const LichChayMaster = mongoose.model("LichChay", LichChayMasterSchema);

export default LichChayMaster;
