// models/chiTietTuyenDuong.model.js
import mongoose from "mongoose";

const chiTietTuyenDuongSchema = new mongoose.Schema(
  {
    tuyenDuong: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TuyenDuong",
      required: true,
    }, // FK
    diaDiem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiaDiem",
      required: true,
    }, // FK
    thuTu: { type: Number, required: true },
    loaiDiem: {
      type: String,
      enum: ["don", "tra", "trunggian"], // bạn có thể mở rộng thêm
      required: true,
    },
    khoangCach: { type: Number, required: true }, // km
    thoiGianDuKien: { type: Number, required: true }, // phút
  },
  { timestamps: true }
);

export default mongoose.model("ChiTietTuyenDuong", chiTietTuyenDuongSchema);
