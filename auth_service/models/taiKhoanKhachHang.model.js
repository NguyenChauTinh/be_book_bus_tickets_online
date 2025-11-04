import mongoose from 'mongoose';
const { Schema } = mongoose;

const taiKhoanKhachHangSchema = new Schema(
  {
    soDienThoai: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      unique: true,
      trim: true,
    },
    trangThai: {
      type: String,
      enum: ['active', 'banned'],
      default: 'active',
    },
    thongTinKhachHang: {
      type: Schema.Types.ObjectId,
      ref: 'KhachHang',
      required: true,
    },
  },
  { timestamps: true }
);


const TaiKhoanKhachHang = mongoose.model('TaiKhoanKhachHang', taiKhoanKhachHangSchema);
export default TaiKhoanKhachHang;