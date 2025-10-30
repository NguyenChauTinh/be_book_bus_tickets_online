import mongoose from "mongoose";

const HoaDonSchema = new mongoose.Schema(
  {
    maHoaDon: { 
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    veXe: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VeXe',
      required: true,
    },
    chiTietVeThanhToan: [{
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    }],
    soTien: {
      type: Number,
      required: true,
    },
    phuongThuc: {
      type: String,
      enum: ['VNPAY', 'CHUYEN_KHOAN_MANUAL', 'TIEN_MAT'],
      required: true,
    },
    trangThai: {
      type: String,
      enum: ['CHO_THANH_TOAN', 'THANH_CONG', 'THAT_BAI'],
      default: 'CHO_THANH_TOAN',
    },
    donViThanhToan: {
      type: String, 
      default: null,
    },
    noiDungThanhToan: {
      type: String,
      trim: true,
    },
    thoiGianThanhToan: { 
        type: Date, 
    },
    
    maGiaoDichVNPAY: { 
      type: String, 
    },
    maNganHangVNPAY: {
      type: String,
    },
    loaiTheVNPAY: { 
        type: String,
    },
    maPhanHoiVNPAY: { 
        type: String,
    },
    vnpayResponseData: {
        type: Object,
    }
  },
  {
    timestamps: true, 
    _id: true
  }
);

const HoaDon = mongoose.model("HoaDon", HoaDonSchema);

export default HoaDon;