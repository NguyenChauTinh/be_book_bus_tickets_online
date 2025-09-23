import KhuyenMai from '../models/khuyenMai.model.js';

export const taoKhuyenMai = async (req, res) => {
    try {
        const newKhuyenMai = new KhuyenMai(req.body);
        const khuyenMai = await newKhuyenMai.save();
        res.status(201).json({ success: true, message: 'Thêm khuyến mãi thành công.', data: khuyenMai });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Mã khuyến mãi đã tồn tại.', error: err.message });
        }
        res.status(500).json({ success: false, message: 'Lỗi khi thêm khuyến mãi.', error: err.message });
    }
};

export const capNhatKhuyenMai = async (req, res) => {
    try {
        const { id } = req.params;
        const khuyenMai = await KhuyenMai.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!khuyenMai) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi để cập nhật.' });
        }
        res.status(200).json({ success: true, message: 'Cập nhật khuyến mãi thành công.', data: khuyenMai });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật khuyến mãi.', error: err.message });
    }
};

export const voHieuHoaKhuyenMai = async (req, res) => {
    try {
        const { id } = req.params;
        const khuyenMai = await KhuyenMai.findByIdAndUpdate(id, { trangThai: false }, { new: true });
        if (!khuyenMai) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi để vô hiệu hóa.' });
        }
        res.status(200).json({ success: true, message: 'Vô hiệu hóa khuyến mãi thành công.', data: khuyenMai });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi vô hiệu hóa khuyến mãi.', error: err.message });
    }
};

export const khoiPhucKhuyenMai = async (req, res) => {
    try {
        const { id } = req.params;
        const khuyenMai = await KhuyenMai.findByIdAndUpdate(id, { trangThai: true }, { new: true });
        if (!khuyenMai) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi để khôi phục.' });
        }
        res.status(200).json({ success: true, message: 'Khôi phục khuyến mãi thành công.', data: khuyenMai });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi khôi phục khuyến mãi.', error: err.message });
    }
};

export const timKhuyenMai = async (req, res) => {
    try {
        const { trangThai, searchTerm } = req.query;
        let query = {};

        if (trangThai !== undefined) {
            query.trangThai = trangThai === 'true';
        }

        if (searchTerm) {
            query.$or = [
                { maKhuyenMai: { $regex: searchTerm, $options: 'i' } },
                { tenKhuyenMai: { $regex: searchTerm, $options: 'i' } },
            ];
        }

        const khuyenMais = await KhuyenMai.find(query);
        res.status(200).json({ success: true, data: khuyenMais });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi tìm kiếm khuyến mãi.', error: err.message });
    }
};

export const layKhuyenMaiTheoId = async (req, res) => {
    try {
        const khuyenMai = await KhuyenMai.findById(req.params.id);
        if (!khuyenMai) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi.' });
        }
        res.status(200).json({ success: true, data: khuyenMai });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin khuyến mãi.', error: err.message });
    }
};