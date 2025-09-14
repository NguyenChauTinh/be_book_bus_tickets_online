import LichChay from "../models/lichChay.model.js";
import LichChayChiTiet from "../models/lichChayChiTiet.model.js";

export const createLichChay = async (req, res) => {
  try {
    const {
      tuyenDuongId,
      maLich,
      tenLich,
      thoiGianBatDau,
      thoiGianKetThuc,
      chiTiet,
    } = req.body;

    // Tạo lịch chạy
    const lich = await LichChay.create({
      tuyenDuong: tuyenDuongId,
      maLich,
      tenLich,
      thoiGianBatDau,
      thoiGianKetThuc,
    });

    // Nếu có chi tiết giờ chạy
    if (chiTiet?.length) {
      const chiTietDocs = await LichChayChiTiet.insertMany(
        chiTiet.map((ct) => ({
          lichChay: lich._id,
          gioChay: ct.gioChay,
          active: ct.active ?? true,
        }))
      );
      lich.chiTietLich = chiTietDocs.map((d) => d._id);
      await lich.save();
    }

    res.status(201).json(lich);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getLichChay = async (req, res) => {
  try {
    const lich = await LichChay.findById(req.params.id)
      .populate("tuyenDuong", "maTuyen tenTuyen") // lấy tên tuyến
      .populate("chiTietLich"); // lấy giờ chạy

    if (!lich)
      return res.status(404).json({ error: "Không tìm thấy lịch chạy" });

    res.json(lich);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllLichChay = async (req, res) => {
  try {
    const lichList = await LichChay.find()
      .populate("tuyenDuong", "maTuyen tenTuyen") // lấy tên tuyến
      .populate("chiTietLich"); // lấy giờ chạy

    res.json(lichList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateLichChay = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tuyenDuongId,
      maLich,
      tenLich,
      thoiGianBatDau,
      thoiGianKetThuc,
      chiTiet,
    } = req.body;
    const lich = await LichChay.findById(id);
    if (!lich) {
      return res.status(404).json({ error: "Không tìm thấy lịch chạy" });
    }
    lich.tuyenDuong = tuyenDuongId;
    lich.maLich = maLich;
    lich.tenLich = tenLich;
    lich.thoiGianBatDau = thoiGianBatDau;
    lich.thoiGianKetThuc = thoiGianKetThuc;
    await lich.save();

    // Cập nhật chi tiết giờ chạy nếu có
    if (chiTiet?.length) {
      // Xóa chi tiết cũ
      await LichChayChiTiet.deleteMany({ lichChay: lich._id });
      // Thêm chi tiết mới
      const chiTietDocs = await LichChayChiTiet.insertMany(
        chiTiet.map((ct) => ({
          lichChay: lich._id,
          gioChay: ct.gioChay,
          active: ct.active ?? true,
        }))
      );
      lich.chiTietLich = chiTietDocs.map((d) => d._id);
      await lich.save();
    }
    res.json(lich);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteLichChay = async (req, res) => {
  try {
    const { id } = req.params;
    const lich = await LichChay.findById(id);
    if (!lich) {
      return res.status(404).json({ error: "Không tìm thấy lịch chạy" });
    }
    // Xóa chi tiết giờ chạy liên quan
    await LichChayChiTiet.deleteMany({ lichChay: lich._id });
    await lich.remove();
    res.json({ message: "Xóa lịch chạy thành công" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
