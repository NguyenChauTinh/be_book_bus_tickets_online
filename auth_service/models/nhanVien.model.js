import mongoose from 'mongoose';

const { Schema } = mongoose;

const nhanVienSchema = new Schema({
  maNhanVien: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  tenNhanVien: {
    type: String,
    required: true,
    trim: true,
  },
  soDienThoai: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  namSinh: {
    type: Number,
    required: true,
  },
  hoatDong: {
    type: Boolean,
    default: true,
  },
  loaiNhanVien:{
    type: String,
    enum: ["PHONGVE", "TAIXE", "PHUXE", "HETHONG"]
  }
}, { timestamps: true });

const NhanVien = mongoose.model('NhanVien', nhanVienSchema);
export default NhanVien;