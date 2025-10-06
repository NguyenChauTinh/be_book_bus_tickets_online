import Xe from '../models/xe.model.js';

export const layDanhSachXe = async (req, res) => {
    try {
        const { trangThai } = req.query;
        let query = {};
        if (trangThai !== undefined) {
            query.trangThai = trangThai === 'true';
        }
        const xes = await Xe.find(query).populate('loaiXe');
        res.status(200).json({ success: true, data: xes });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách xe.', error: err.message });
    }
};

export const layXeTheoId = async (req, res) => {
    try {
        const xe = await Xe.findById(req.params.id);
        if (!xe) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy xe.' });
        }
        res.status(200).json({ success: true, data: xe });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin xe.', error: err.message });
    }
};

export const taoXe = async (req, res) => {
    try {
        const newXe = new Xe(req.body);
        const xe = await newXe.save();
        res.status(201).json({ success: true, message: 'Thêm xe mới thành công.', data: xe });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Mã xe hoặc biển số xe đã tồn tại.', error: err.message });
        }
        res.status(500).json({ success: false, message: 'Lỗi khi thêm xe mới.', error: err.message });
    }
};

export const capNhatXe = async (req, res) => {
    try {
        const xe = await Xe.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!xe) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy xe để cập nhật.' });
        }
        res.status(200).json({ success: true, message: 'Cập nhật xe thành công.', data: xe });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật xe.', error: err.message });
    }
};

export const capNhatTrangThaiXe = async (req, res) => {
    try {
        const { id } = req.params;
        const { trangThai } = req.body;
        const xe = await Xe.findByIdAndUpdate(id, { trangThai }, { new: true });
        if (!xe) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy xe để cập nhật trạng thái.' });
        }
        const message = trangThai ? 'Khôi phục xe thành công.' : 'Vô hiệu hóa xe thành công.';
        res.status(200).json({ success: true, message, data: xe });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái xe.', error: err.message });
    }
};