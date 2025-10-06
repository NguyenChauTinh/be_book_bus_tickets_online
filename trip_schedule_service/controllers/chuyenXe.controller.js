import ChuyenXe from '../models/chuyenXe.model.js';

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
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ngày khởi hành (ngayKhoiHanh).' });
        }

        // Xử lý ngày khởi hành để tìm kiếm trong khoảng một ngày (từ 00:00:00 đến 23:59:59)
        const startOfDay = new Date(ngayKhoiHanh);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(ngayKhoiHanh);
        endOfDay.setHours(23, 59, 59, 999);

        const filter = {
            ngayKhoiHanh: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        };

        const trips = await ChuyenXe.find(filter).sort({ ngayKhoiHanh: 1 });

        if (trips.length === 0) {
            return res.status(200).json({ success: false, message: 'Không tìm thấy chuyến xe nào trong ngày này.', data: [] });
        }

        res.status(200).json({ success: true, message: 'Lấy danh sách chuyến xe theo ngày thành công.', data: trips });
    } catch (err) {
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
        const { laiXe, phuXe, xe, trangThai } = req.body;

        const updateData = {};
        if (laiXe !== undefined) updateData.laiXe = laiXe;
        if (phuXe !== undefined) updateData.phuXe = phuXe;
        if (xe !== undefined) updateData.xe = xe;
        if (trangThai !== undefined) updateData.trangThai = trangThai;

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