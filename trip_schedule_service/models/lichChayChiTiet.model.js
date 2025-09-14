import mongoose from "mongoose";

const lichChayChiTietSchema = new mongoose.Schema(
  {
    lichChay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LichChay",
      required: true,
    },
    gioChay: { type: String, required: true }, // ví dụ: "08:00", "14:30"
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("LichChayChiTiet", lichChayChiTietSchema);
