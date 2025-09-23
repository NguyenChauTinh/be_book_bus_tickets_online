import mongoose from 'mongoose';

const GheSchema = new mongoose.Schema({
    maSoGhe: {
        type: String,
        required: true,
        trim: true,
    },
    hang: {
        type: Number,
        required: true,
    },
    day: {
        type: Number,
        required: true,
    },
    tang: {
        type: String,
        required: true,
        enum: ['lower', 'upper'],
    },
    trangThai: {
        type: Boolean,
        default: true,
    },
});

export default GheSchema;