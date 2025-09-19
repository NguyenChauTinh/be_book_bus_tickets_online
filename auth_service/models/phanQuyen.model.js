import mongoose from "mongoose";

const quyenSchema = new mongoose.Schema(
  {
    maPhanQuyen: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    tenPhanQuyen: {
      type: String,
      required: true,
      trim: true,
    },
    chucNang:[
      {
        maChucNang: {
          type: String,
          required: true,
        },
        phanQuyen: [
          {
            type: String,
            enum: ["create", "read", "update", "personal", "overall", "print", "export"],
          }
        ]
      }
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Quyen = mongoose.model("Quyen", quyenSchema);

export default Quyen;