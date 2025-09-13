import mongoose from "mongoose";

const diadiemSchema = new mongoose.Schema(
  {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    maDiaDiem: {
      type: String,
      required: [true, "Mã địa điểm là bắt buộc"],
    },
    tenDiaDiem: {
      type: String,
      required: [true, "Tên địa điểm là bắt buộc"],
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

const diadiem = mongoose.model("diadiem", diadiemSchema);

export default diadiem;
