import Xe from '../models/xe.model.js';
import redisClient from '../config/redis.js';

const clearXeCache = async () => {
    try {
        const keys = await redisClient.keys('xe_list:*');
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log('Đã xóa cache danh sách xe');
        }
    } catch (error) {
        console.error('Lỗi khi xóa cache xe:', error);
    }
};

export const layDanhSachXe = async (req, res) => {
    try {
        const { trangThai } = req.query;
        
        const statusKey = trangThai !== undefined ? trangThai : 'all';
        const redisKey = `xe_list:${statusKey}`;

        const cachedData = await redisClient.get(redisKey);
        if (cachedData) {
            return res.status(200).json({ 
                success: true, 
                message: 'Lấy dữ liệu từ cache',
                data: JSON.parse(cachedData) 
            });
        }

        let query = {};
        if (trangThai !== undefined) {
            query.trangThai = trangThai === 'true';
        }
        
        const xes = await Xe.find(query).populate('loaiXe').sort({ createdAt: -1 });

        if (xes) {
            await redisClient.setEx(redisKey, 24 * 3600, JSON.stringify(xes));
        }

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
        await clearXeCache();
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
        await clearXeCache();
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
        await clearXeCache();
        res.status(200).json({ success: true, message, data: xe });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái xe.', error: err.message });
    }
};