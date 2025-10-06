
import mongoose from "mongoose";
import ChiTietVeSchema from "./chiTietVe.model.js";

const VeXeSchema = new mongoose.Schema(
  {
    maVe: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
     chuyenXe: {
            type: String, 
            required: true,
            trim: true,
        },

    tenKhachHang: { type: String, required: true },
    soDienThoai: { type: String, required: true },

    tongTien: {
      type: Number,
      required: true,
      default: 0,
    },
    tongTienPhaiTra: {
      type: Number,
      required: true,
      default: 0,
    },
    tongTienDaThanhToan: {
      type: Number,
      required: true,
      default: 0,
    },
    maGiamGia: {
      type: String,
      trim: true,
      default: null,
    },

    chiTiet: {
      type: [ChiTietVeSchema],
      default: [],
    },

    trangThaiVe: {
      type: String,
      enum: ["CHO_THANH_TOAN", "DA_THANH_TOAN", "DA_HUY", "DA_CHUYEN"],
      default: "CHO_THANH_TOAN",
    },
  },
  {
    timestamps: true,
    _id: true
  }
);

const VeXe = mongoose.model("VeXe", VeXeSchema);

export default VeXe;
