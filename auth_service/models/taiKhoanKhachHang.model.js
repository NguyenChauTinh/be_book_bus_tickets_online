import mongoose from 'mongoose';
const { Schema } = mongoose;
const lichSuTimKiemSchema = new Schema({
    diemDiId: { 
        type: Schema.Types.ObjectId, 
        required: true 
    },
    diemDenId: { 
        type: Schema.Types.ObjectId, 
        required: true 
    },
    tenDiemDi: { 
        type: String, 
        required: true 
    },
    tenDiemDen: { 
        type: String, 
        required: true 
    },
    ngayKhoiHanh: { 
        type: Date, 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
}, { _id: false });
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
    soLuongVeDaDat:{
      type: Number,
      default: 0
    },
    lichSuTimKiem: [lichSuTimKiemSchema]
  },
  { timestamps: true }
);


const TaiKhoanKhachHang = mongoose.model('TaiKhoanKhachHang', taiKhoanKhachHangSchema);
export default TaiKhoanKhachHang;