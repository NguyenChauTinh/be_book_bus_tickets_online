import mongoose from "mongoose";

const LichSuVeXeSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VeXe",
      required: true,
      index: true,
    },
    chiTietVeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "PAYMENT", "MOVE", "SWAP_TARGET", "CANCEL", "ADD_DETAIL"],
      required: true,
    },
    nhanVienThucHien: {
      type: String, 
      default: "SYSTEM",
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    thoiGian: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

const LichSuVeXe = mongoose.model("LichSuVeXe", LichSuVeXeSchema);
export default LichSuVeXe;