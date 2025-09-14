import mongoose from "mongoose";

const diadiemSchema = new mongoose.Schema(
  {
    maDiaDiem: {
      type: String,
      required: [true, "Mã địa điểm là bắt buộc"],
      unique: true,
      trim: true,
    },
    tenDiaDiem: {
      type: String,
      required: [true, "Tên địa điểm là bắt buộc"],
    },
    diaChi: {
      type: String,
    },
    ghiChu: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const diadiem = mongoose.model("DiaDiem", diadiemSchema);

export default diadiem;
