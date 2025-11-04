import mongoose from 'mongoose';
const { Schema } = mongoose;

const khachHangSchema = new Schema(
  {
    hoVaTen: {
      type: String,
      required: [true, 'Họ và tên là bắt buộc'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true, 
    },
    ngaySinh: {
      type: String, 
    },
    gioiTinh: {
      type: String,
      enum: ['Nam', 'Nữ', 'Khác'],
    },
    taiKhoan: {
      type: Schema.Types.ObjectId,
      ref: 'TaiKhoanKhachHang',
    },
  },
  { timestamps: true }
);

const KhachHang = mongoose.model('KhachHang', khachHangSchema);
export default KhachHang;