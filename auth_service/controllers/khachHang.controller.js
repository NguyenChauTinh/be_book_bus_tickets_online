import TaiKhoan from '../models/taiKhoanKhachHang.model.js';
import KhachHang from '../models/khachHang.model.js';

export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const taiKhoan = await TaiKhoan.findById(userId).populate(
      'thongTinKhachHang'
    );
    if (!taiKhoan) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }
    res.status(200).json(taiKhoan.thongTinKhachHang);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { userId, hoVaTen, email, ngaySinh, gioiTinh } = req.body;

    const taiKhoan = await TaiKhoan.findById(userId);
    if (!taiKhoan) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    const updatedProfile = await KhachHang.findByIdAndUpdate(
      taiKhoan.thongTinKhachHang,
      { hoVaTen, email, ngaySinh, gioiTinh },
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy thông tin khách hàng.' });
    }

    res.status(200).json({message: "Thay đổi thành công", data : updatedProfile});
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};