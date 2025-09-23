import mongoose from 'mongoose';

const { Schema } = mongoose;

const XeSchema = new Schema({
    maXe: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    bienSo: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    nhanHieu: {
        type: String,
        required: true,
        trim: true
    },
    hanDangKiem: {
        type: Date,
        required: true
    },
    hanBaoDuong: {
        type: Date,
        required: true
    },
    loaiXe: {
        type: Schema.Types.ObjectId,
        ref: 'LoaiXe',
        required: true
    },
    trangThai: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true 
});

const Xe = mongoose.model('Xe', XeSchema);

export default Xe;