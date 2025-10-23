import ChuyenXe from '../models/chuyenXe.model.js';
import axios from 'axios';

export const createChuyenXeDonLe = async (req, res) => {
    try {
        const newTrip = new ChuyenXe(req.body);
        const savedTrip = await newTrip.save();
        res.status(201).json({ message: 'Đã tạo chuyến xe thành công.', data: savedTrip });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getDanhSachChuyenXe = async (req, res) => {
    try {
        const { tuyenDuong, ngayKhoiHanh } = req.query;
        const filter = {};
        if (tuyenDuong) filter.tuyenDuong = tuyenDuong;
        
        if (ngayKhoiHanh) {
            const startOfDay = new Date(ngayKhoiHanh);
            startOfDay.setHours(0, 0, 0, 0); 
            
            const endOfDay = new Date(ngayKhoiHanh);
            endOfDay.setHours(23, 59, 59, 999); 
            
            filter.ngayKhoiHanh = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }
        
        const trips = await ChuyenXe.find(filter);
        res.status(200).json({success: true, message: 'Lấy chuyến xe thành công', data: trips});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Hàm mới: Lấy danh sách chuyến xe chỉ theo ngày khởi hành
export const getDanhSachChuyenXeTheoNgay = async (req, res) => {
    try {
        const { ngayKhoiHanh } = req.query;
        if (!ngayKhoiHanh) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ngày khởi hành.' });
        }

        const startOfDay = new Date(ngayKhoiHanh);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(ngayKhoiHanh);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Bước 1: Lấy danh sách chuyến xe gốc
        const trips = await ChuyenXe.find({
            ngayKhoiHanh: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ gioKhoiHanh: 1 }).lean();

        if (trips.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // Bước 2: Lấy tất cả ID của các chuyến xe
        const tripIds = trips.map(trip => trip._id.toString());
        console.log("Trip IDs:", tripIds);
        
        let ticketCountsMap = {};
        try {
            // Bước 3: Gọi API đến service vé xe để lấy số lượng vé
            const response = await axios.post('http://localhost:3005/api/v1/ve-xe/thong-ke/so-luong-theo-chuyen', {
                chuyenXeIds: tripIds
            });
            if (response.data.success) {
                ticketCountsMap = response.data.data;
            }
        } catch (apiError) {
            console.error("Lỗi khi gọi đến Ticket Service:", apiError.message);
            // Không chặn chương trình nếu service vé lỗi, chỉ log lại
        }

        const tripsWithBookedCount = trips.map(trip => ({
            ...trip,
            soVeDaDat: ticketCountsMap[trip._id.toString()] || 0 
        }));
        

        res.status(200).json({ success: true, message: 'Lấy danh sách chuyến xe thành công.', data: tripsWithBookedCount });

    } catch (err) {
        console.error("Lỗi khi lấy danh sách chuyến xe:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
// --- Phần còn lại của Controller không thay đổi, nhưng tôi đã cập nhật getDanhSachChuyenXe để nó xử lý ngày tốt hơn ---

export const getChuyenXeByID = async (req, res) => {
    try {
        const trip = await ChuyenXe.findOne({ maChuyenXe: req.params.id });
        if (!trip) {
            return res.status(404).json({ message: 'Không tìm thấy chuyến xe.' });
        }
        
        
        res.status(200).json({success: true, message: 'Lấy chuyến xe thành công', data: trip});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateTrangThaiChuyenXe = async (req, res) => {
    try {
        const { id } = req.params;
        const { trangThai } = req.body;
        const updateData = { trangThai };

        if (trangThai === 'DA_XUAT_BEN') {
            const existingTrip = await ChuyenXe.findById(id);
            if (existingTrip && existingTrip.trangThai === 'CHUA_XUAT_BEN') {
                updateData.thoiGianXuatBenThucTe = new Date(); 
            }
        } else if (trangThai === 'HUY_CHUYEN') {
            updateData.thoiGianHuyChuyen = new Date(); 
        }
        
        const updatedTrip = await ChuyenXe.findByIdAndUpdate(id, updateData, { new: true });
        
        res.status(200).json({ message: 'Cập nhật trạng thái chuyến xe thành công.', data: updatedTrip });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateChuyenXe = async (req, res) => {
    try {
        const { id } = req.params;
        const { laiXe, phuXe, xe, trangThai, ghiChu } = req.body;

        const updateData = {};
        if (laiXe !== undefined) updateData.laiXe = laiXe;
        if (phuXe !== undefined) updateData.phuXe = phuXe;
        if (xe !== undefined) updateData.xe = xe;
        if (trangThai !== undefined) updateData.trangThai = trangThai;
        if (ghiChu !== undefined) updateData.ghiChu = ghiChu;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Không có dữ liệu hợp lệ để cập nhật.' });
        }

        const updatedTrip = await ChuyenXe.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedTrip) {
            return res.status(404).json({ message: 'Không tìm thấy chuyến xe.' });
        }

        res.status(200).json({
            message: 'Cập nhật chuyến xe thành công.',
            data: updatedTrip,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};