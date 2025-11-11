import mongoose from "mongoose";

const ChiTietVeSchema = new mongoose.Schema(
  {
    chuyenXe: {
      type: String,
      required: true,
      trim: true,
    },
    tenKhachHang: {
      type: String,
      required: true,
    },
    soDienThoai: {
      type: String,
      required: true,
    },
    maChoNgoi: {
      type: String,
      required: true,
      trim: true,
    },
    diemDon: {
      type: String,
      trim: true,
      default: "Tại bến",
    },
    diemDonTC: {
      type: String,
      trim: true,
      default: null,
    },
    diemTra: {
      type: String,
      trim: true,
      default: "Tại bến",
    },
    diemTraTC: {
      type: String,
      trim: true,
      default: null,
    },
    giaVeCoBan: {
      type: Number,
      required: true,
      default: 0,
    },
    phuThu: {
      type: Number,
      default: 0,
    },
    giamGia: {
      type: Number,
      default: 0,
    },
    hinhThucThanhToan: {
      type: String,
      enum: [
        "TAI_VAN_PHONG",
        "DAI_LY",
        "CHUYEN_KHOAN",
        "VNPAY",
        "KHONG_THU_TIEN",
        null,
      ],
      default: null,
    },
    nhanVienTao: {
      type: String,
      default: null,
    },
    nhanVienThuTien: {
      type: String,
      default: null,
    },
    donViThanhToan: {
      type: String,
      default: null,
    },
    ghiChu: {
      type: String,
      trim: true,
      default: null,
    },
    trangThaiChiTiet: {
      type: String,
      enum: ["DAT_CHO", "DA_THANH_TOAN", "DA_HUY", "DA_CHUYEN", "DA_HOAN_TIEN"],
      default: "DAT_CHO",
    },
    hoaDon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HoaDon",
      default: null,
    },
    lyDoHuy: {
      type: String,
      default: null,
    },
    ngayHuy: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

export default ChiTietVeSchema;
