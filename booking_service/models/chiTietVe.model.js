// models/chiTietVe.model.js (Hoặc đặt chung trong VeXe.model.js)

import mongoose from 'mongoose';

const ChiTietVeSchema = new mongoose.Schema({
    choNgoi: {
        type: String,
        required: true,
        trim: true,
    },
    diemDon: {
        type: String,
        trim: true,
        default: 'Tại bến',
    },
    diemDonTC: { 
        type: String,
        trim: true,
        default: null,
    },
    diemTra: {
        type: String,
        trim: true,
        default: 'Tại bến',
    },
    diemTraTC: { 
        type: String,
        trim: true,
        default: null,
    },

    giaVeCoBan: { 
        type: Number,
        required: true,
        default: 0,
    },
    phuThu: {
        type: Number,
        default: 0,
    },
    giamGia: {
        type: Number,
        default: 0,
    },
    hinhThucThanhToan: {
        type: String,
        trim: true,
        default: 'CHUA_THANH_TOAN',
    },

    ghiChu: {
        type: String,
        trim: true,
        default: null,
    },
    trangThaiChiTiet: { 
        type: String,
        enum: ['DAT_CHO', 'DA_THANH_TOAN', 'DA_HUY', 'DA_CHUYEN', 'DA_HOAN_TIEN'],
        default: 'DAT_CHO',
    },
}, { _id: true });
export default ChiTietVeSchema;