import mongoose from "mongoose";

const lichChaySchema = new mongoose.Schema(
  {
    tuyenDuong: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TuyenDuong",
      required: true,
    },
    maLich: { type: String, required: true, unique: true },
    tenLich: { type: String, required: true },
    thoiGianBatDau: { type: Date, required: true },
    thoiGianKetThuc: { type: Date, required: true },
    active: { type: Boolean, default: true },
    chiTietLich: [
      { type: mongoose.Schema.Types.ObjectId, ref: "LichChayChiTiet" },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("LichChay", lichChaySchema);
