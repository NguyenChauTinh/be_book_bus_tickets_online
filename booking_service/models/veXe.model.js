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

    tongTien: {
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
  },
  {
    timestamps: true,
    _id: true,
  }
);

const VeXe = mongoose.model("VeXe", VeXeSchema);

export default VeXe;
