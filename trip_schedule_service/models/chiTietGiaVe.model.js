const mongoose = require("mongoose");

const ChiTietGiaVeSchema = new mongoose.Schema(
  {
    maChiTiet: { type: String, required: true, unique: true },
    soTienThanhToan: { type: Number, required: true },
    ghiChu: { type: String },

    // Mỗi chi tiết giá vé thuộc về 1 giá vé
    giaVe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GiaVe",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChiTietGiaVe", ChiTietGiaVeSchema);

export default chiTietGiaVe;
