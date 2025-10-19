import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const { Schema } = mongoose;

const taiKhoanSchema = new Schema(
  {
    tenTaiKhoan: {
      type: String,
      required: [true, "Tên tài khoản không được để trống!"],
      unique: true,
      trim: true,
    },
    matKhau: {
      type: String,
      required: [true, "Mật khẩu không được để trống!"],
      minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự."],
    },
    trangThai: {
      type: Boolean,
      default: true,
    },
    nhanVien: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NhanVien",
      required: [true, "Tài khoản phải liên kết với một nhân viên."],
      unique: true,
    },
    vaiTro: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VaiTro",
      },
    ],
    donViCongTac: {
      type: String,
      required: [true, "Đơn vị công tác không được để trống!"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

taiKhoanSchema.pre("save", async function (next) {
  if (!this.isModified("matKhau")) {
    return next();
  }
  const salt = await bcryptjs.genSalt(10);
  this.matKhau = await bcryptjs.hash(this.matKhau, salt);
  next();
});

const TaiKhoan = mongoose.model("TaiKhoan", taiKhoanSchema);

export default TaiKhoan;
