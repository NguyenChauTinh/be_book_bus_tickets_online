import mongoose from 'mongoose';
const { Schema } = mongoose;

export const LoaiDieuKien = {
    DAT_LAN_DAU: 'DAT_LAN_DAU',
    SO_LUONG_VE: 'SO_LUONG_VE',
    TONG_TIEN_HOA_DON: 'TONG_TIEN_HOA_DON',
    GIO_THAP_DIEM: 'GIO_THAP_DIEM',
};

export const LoaiKhuyenMai = {
    GIAM_PHAN_TRAM: 'GIAM_PHAN_TRAM',
    GIAM_TIEN: 'GIAM_TIEN',
    TANG_VE: 'TANG_VE',
};

const KhuyenMaiConditionSchema = new Schema({
    loaiDieuKien: {
        type: String,
        enum: Object.values(LoaiDieuKien),
        required: true,
    },
    soLuongToiThieu: {
        type: Number,
        min: 1,
    },
    tongTienToiThieu: {
        type: Number,
        min: 0,
    },
    loaiHanhTrinh: {
        type: String,
        enum: ['KHU_HOI', 'MOT_CHIEU'],
    },
    gioBatDau: {
        type: Number,
    },
    gioKetThuc: {
        type: Number,
    }
});

const KhuyenMaiDetailSchema = new Schema({
    phanTramGiam: {
        type: Number,
        min: 0,
        max: 100,
    },
    soTienGiamToiDa: { 
        type: Number,
        min: 0,
    },
    soTienGiam: {
        type: Number,
        min: 0,
    },
    soLuongVeTang: {
        type: Number,
        min: 0,
    }
});

const KhuyenMaiLineSchema = new Schema({
    maLine: {
        type: String,
        required: true,
        trim: true,
    },
    loaiKhuyenMai: {
        type: String,
        enum: Object.values(LoaiKhuyenMai),
        required: true,
    },
    chiTiet: {
        type: KhuyenMaiDetailSchema,
        required: true,
    },
    dieuKienApDung: [KhuyenMaiConditionSchema],
    trangThai:{
        type: Boolean,
        default: true
    },
    ghiChu: {
        type: String,
        trim: true,
    }

});

const KhuyenMaiMasterSchema = new Schema({
    maKhuyenMai: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    tenKhuyenMai: {
        type: String,
        required: true,
    },
    ngayBatDau: {
        type: Date,
        required: true,
    },
    ngayKetThuc: {
        type: Date,
        required: true,
    },
    moTa: {
        type: String,
    },
    trangThai: {
        type: Boolean,
        default: true,
    },
    lines: [KhuyenMaiLineSchema],
}, {
    timestamps: true,
});

const KhuyenMai = mongoose.model('KhuyenMai', KhuyenMaiMasterSchema);

export default KhuyenMai;