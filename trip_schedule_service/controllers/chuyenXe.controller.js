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
    if (ngayKhoiHanh) filter.ngayKhoiHanh = new Date(ngayKhoiHanh);
    
    const trips = await ChuyenXe.find(filter);
    res.status(200).json({success: true, message: 'Lấy chuyến xe thành công', data: trips});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
    
    const updatedTrip = await ChuyenXe.findByIdAndUpdate(id, { trangThai }, { new: true });
    
    if (!updatedTrip) {
      return res.status(404).json({ message: 'Không tìm thấy chuyến xe.' });
    }
    
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
