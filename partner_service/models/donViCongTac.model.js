import mongoose from 'mongoose';

const donViCongTacSchema = new mongoose.Schema({
    maDonVi: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    tenDonVi: {
        type: String,
        required: true,
        trim: true,
    },
    soDienThoai: {
        type: String,
        trim: true,
    },
    diaChi: {
        type: String,
        trim: true,
    },
    loaiDonVi: {
        type: String,
        required: true,
        enum: ['VANPHONG', 'DAILY'],
    },
    ghiChu: {
        type: String,
        trim: true,
    },
    trangThai: {
        type: Boolean,
        required: true,
        default: true,
    },
}, {
    timestamps: true,
});

const DonViCongTac = mongoose.model('DonViCongTac', donViCongTacSchema);

export default DonViCongTac;