import mongoose from 'mongoose';
import GheSchema from './ghe.model.js';

const LoaiXeSchema = new mongoose.Schema(
    {
        maLoaiXe: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        tenLoaiXe: {
            type: String,
            required: true,
            trim: true,
        },
        moTa: {
            type: String,
            trim: true,
        },
        trangThai: {
            type: Boolean,
            default: true,
        },
        soDoGhe: {
            type: [GheSchema], 
            default: [],
        },
        soLuongGhe: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    {
        timestamps: true,
    }
);

const LoaiXe = mongoose.model('LoaiXe', LoaiXeSchema);

export default LoaiXe;