// models/tuyenDuong.model.js
import mongoose from "mongoose";

const tuyenDuongSchema = new mongoose.Schema(
  {
    maTuyen: { type: String, required: true, unique: true, trim: true },
    tenTuyen: { type: String, required: true },
    khoangCachTuyenDuong: { type: Number, required: true },
    thoiGian: { type: Number, required: true },
    ghiChu: { type: String },
    active: { type: Boolean, default: true },
    chiTietTuyen: [
      { type: mongoose.Schema.Types.ObjectId, ref: "ChiTietTuyenDuong" },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("TuyenDuong", tuyenDuongSchema);
