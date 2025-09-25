import mongoose from "mongoose";

const { Schema } = mongoose;

const chiTietTuyenDuongSchema = new Schema(
  {
    tuyenDuong: {
      type: Schema.Types.ObjectId,
      ref: "TuyenDuong",
      required: true,
    },
    diaDiem: {
      type: Schema.Types.ObjectId,
      ref: "DiaDiem",
      required: true,
    },
    thuTu: { type: Number, required: true },
    loaiDiem: {
      type: String,
      enum: ["don", "trunggian"],
      required: true,
    },
    khoangCach: { type: Number, required: true },
    thoiGianDuKien: { type: Number, required: true },
  },
  { timestamps: true }
);

const ChiTietTuyenDuong = mongoose.model(
  "ChiTietTuyenDuong",
  chiTietTuyenDuongSchema
);

export default ChiTietTuyenDuong;
