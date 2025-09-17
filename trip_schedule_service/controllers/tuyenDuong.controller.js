import TuyenDuong from "../models/tuyenDuong.model.js";
import ChiTietTuyenDuong from "../models/chiTietTuyenDuong.model.js";

export const createTuyenDuong = async (req, res) => {
  try {
    const {
      maTuyen,
      tenTuyen,
      khoangCachTuyenDuong,
      thoiGian,
      ghiChu,
      chiTiet,
    } = req.body;

    console.log(req.body);

    // tạo tuyến đường
    const tuyen = await TuyenDuong.create({
      maTuyen,
      tenTuyen,
      khoangCachTuyenDuong,
      thoiGian,
      ghiChu,
    });

    // nếu có chi tiết kèm theo
    if (chiTiet?.length) {
      const chiTietDocs = await ChiTietTuyenDuong.insertMany(
        chiTiet.map((ct) => ({
          tuyenDuong: tuyen._id,
          diaDiem: ct.diaDiem?._id || ct.diaDiem, // lấy _id trong object hoặc string id
          thuTu: ct.thuTu,
          loaiDiem: ct.loaiDiem,
          khoangCach: ct.khoangCach,
          thoiGianDuKien: ct.thoiGianDuKien,
        }))
      );

      tuyen.chiTietTuyen = chiTietDocs.map((d) => d._id);
      await tuyen.save();
    }

    res.status(201).json(tuyen);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getTuyenDuong = async (req, res) => {
  try {
    const tuyen = await TuyenDuong.findById(req.params.id).populate({
      path: "chiTietTuyen",
      populate: { path: "diaDiem", select: "maDiaDiem tenDiaDiem" },
    });

    if (!tuyen) return res.status(404).json({ error: "Không tìm thấy tuyến" });

    res.json(tuyen);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateTuyenDuong = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      maTuyen,
      tenTuyen,
      khoangCachTuyenDuong,
      thoiGian,
      ghiChu,
      chiTiet,
    } = req.body;
    const tuyen = await TuyenDuong.findById(id);
    if (!tuyen) return res.status(404).json({ error: "Không tìm thấy tuyến" });
    tuyen.maTuyen = maTuyen || tuyen.maTuyen;
    tuyen.tenTuyen = tenTuyen || tuyen.tenTuyen;
    tuyen.khoangCachTuyenDuong =
      khoangCachTuyenDuong || tuyen.khoangCachTuyenDuong;
    tuyen.thoiGian = thoiGian || tuyen.thoiGian;
    tuyen.ghiChu = ghiChu || tuyen.ghiChu;
    if (chiTiet?.length) {
      await ChiTietTuyenDuong.deleteMany({ tuyenDuong: tuyen._id });
      const chiTietDocs = await ChiTietTuyenDuong.insertMany(
        chiTiet.map((ct) => ({
          tuyenDuong: tuyen._id,
          diaDiem: ct.diaDiemId,
          thuTu: ct.thuTu,
          loaiDiem: ct.loaiDiem,
          khoangCach: ct.khoangCach,
          thoiGianDuKien: ct.thoiGianDuKien,
        }))
      );
      tuyen.chiTietTuyen = chiTietDocs.map((d) => d._id);
    }

    await tuyen.save();
    res.json(tuyen);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const deleteTuyenDuong = async (req, res) => {
  try {
    const { id } = req.params;
    const tuyen = await TuyenDuong.findById(id);
    if (!tuyen) return res.status(404).json({ error: "Không tìm thấy tuyến" });
    await ChiTietTuyenDuong.deleteMany({ tuyenDuong: tuyen._id });
    await tuyen.remove();
    res.json({ message: "Xóa tuyến thành công" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
export const listTuyenDuong = async (req, res) => {
  try {
    const tuyens = await TuyenDuong.find().populate({
      path: "chiTietTuyen",
      populate: { path: "diaDiem", select: "maDiaDiem tenDiaDiem" },
    });
    res.json(tuyens);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xóa chi tiết tuyến đường
export const deleteChiTietTuyenDuong = async (req, res) => {
  try {
    const { id } = req.params;
    const chiTiet = await ChiTietTuyenDuong.findById(id);
    if (!chiTiet)
      return res.status(404).json({ error: "Không tìm thấy chi tiết tuyến" });
    await chiTiet.remove();
    res.json({ message: "Xóa chi tiết tuyến thành công" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Thay đổi active của tuyến đường
export const toggleActiveTuyenDuong = async (req, res) => {
  try {
    const { id } = req.params;
    const tuyen = await TuyenDuong.findById(id);
    if (!tuyen) return res.status(404).json({ error: "Không tìm thấy tuyến" });
    tuyen.active = !tuyen.active;
    await tuyen.save();
    res.json({ message: "Thay đổi trạng thái tuyến thành công", tuyen });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
