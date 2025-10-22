import GiaVe from "../models/giaVe.model.js";
import mongoose from "mongoose";

export const createGiaVe = async (req, res) => {
  try {
    const giaVe = new GiaVe(req.body);
    await giaVe.save();
    res.status(201).json(giaVe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllGiaVe = async (req, res) => {
  try {
    const giaVes = await GiaVe.find();

    res.json(giaVes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getGiaVeById = async (req, res) => {
  try {
    const giaVe = await GiaVe.findById(req.params.id);

    if (!giaVe) return res.status(404).json({ error: "Không tìm thấy giá vé" });
    res.json(giaVe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateGiaVe = async (req, res) => {
  try {
    const giaVe = await GiaVe.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!giaVe) return res.status(404).json({ error: "Không tìm thấy giá vé" });
    res.json(giaVe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const deleteGiaVe = async (req, res) => {
  try {
    const giaVe = await GiaVe.findById(req.params.id);
    if (!giaVe) {
      return res.status(404).json({ error: "Không tìm thấy giá vé" });
    }

    // Thay vì xóa, ta chỉ vô hiệu hóa nó
    giaVe.active = false;
    await giaVe.save();

    res.json({ message: "Vô hiệu hóa bảng giá thành công", data: giaVe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addChiTietGiaVe = async (req, res) => {
  try {
    const giaVe = await GiaVe.findById(req.params.id);
    if (!giaVe) return res.status(404).json({ error: "Không tìm thấy giá vé" });
    
    const { tuyenDuong, loaiXe, soTienThanhToan } = req.body;
    if (!tuyenDuong || !loaiXe || soTienThanhToan === undefined) {
        return res.status(400).json({ error: "Thiếu thông tin tuyến đường, loại xe hoặc số tiền." });
    }

    giaVe.chiTietGiaVe.push({ tuyenDuong, loaiXe, soTienThanhToan });
    await giaVe.save();

    res.json(giaVe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateChiTietGiaVe = async (req, res) => {
    try {
        const { id, chiTietId } = req.params;
        const { soTienThanhToan } = req.body;

        const giaVe = await GiaVe.findById(id);
        if (!giaVe) return res.status(404).json({ error: "Không tìm thấy bảng giá." });

        const chiTiet = giaVe.chiTietGiaVe.id(chiTietId);
        if (!chiTiet) return res.status(404).json({ error: "Không tìm thấy chi tiết giá vé." });
        
        if (soTienThanhToan !== undefined) {
            chiTiet.soTienThanhToan = soTienThanhToan;
        }

        await giaVe.save();
        res.json(giaVe);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteChiTietGiaVe = async (req, res) => {
  try {
    const { id, chiTietId } = req.params;
    const giaVe = await GiaVe.findById(id);
    if (!giaVe) return res.status(404).json({ error: "Không tìm thấy giá vé" });

    giaVe.chiTietGiaVe = giaVe.chiTietGiaVe.filter(
      (ct) => ct._id.toString() !== chiTietId
    );
    await giaVe.save();

    res.json(giaVe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleActiveStatus = async (req, res) => {
  try {
    const giaVe = await GiaVe.findById(req.params.id);
    if (!giaVe) return res.status(404).json({ error: "Không tìm thấy giá vé" });
    giaVe.active = !giaVe.active;
    await giaVe.save();
    res.json(giaVe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const timGiaVeApDung = async (req, res) => {
    try {
        const { tuyenDuongId, loaiXeId, ngayHienTai } = req.query;

        if (!tuyenDuongId || !loaiXeId || !ngayHienTai) {
            return res.status(400).json({ 
                success: false, 
                message: "Cần cung cấp đủ tuyenDuongId, loaiXeId và ngayHienTai." 
            });
        }

        const currentDate = new Date(ngayHienTai);

        const cacBangGiaPhuHop = await GiaVe.find({
            active: true,
            thoiGianBatDau: { $lte: currentDate },
            thoiGianKetThuc: { $gte: currentDate },
            chiTietGiaVe: {
                $elemMatch: {
                    tuyenDuong: new mongoose.Types.ObjectId(tuyenDuongId),
                    loaiXe: new mongoose.Types.ObjectId(loaiXeId),
                },
            },
        })
        .sort({ updatedAt: -1 });

        if (cacBangGiaPhuHop.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy giá vé phù hợp cho các tiêu chí đã chọn." 
            });
        }

        const bangGiaMoiNhat = cacBangGiaPhuHop[0];

        const chiTietPhuHop = bangGiaMoiNhat.chiTietGiaVe.find(
            (ct) =>
                ct.tuyenDuong.toString() === tuyenDuongId &&
                ct.loaiXe.toString() === loaiXeId
        );

        if (!chiTietPhuHop) {
            return res.status(500).json({ success: false, message: "Lỗi logic: Không tìm thấy chi tiết giá vé dù đã khớp bảng giá." });
        }

        res.json({ success: true, soTienThanhToan: chiTietPhuHop.soTienThanhToan });

    } catch (err) {
        console.error("Lỗi khi tìm giá vé áp dụng:", err);
        res.status(500).json({ success: false, message: "Lỗi máy chủ khi tìm giá vé.", details: err.message });
    }
};