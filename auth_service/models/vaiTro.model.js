import mongoose from "mongoose";

const vaiTroSchema = new mongoose.Schema(
  {
    maVaiTro: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    tenVaiTro: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    phanQuyen: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quyen", 
        required: true,
      },
    ],
  },
  { timestamps: true }
);

const VaiTro = mongoose.model("VaiTro", vaiTroSchema);

export default VaiTro;