import GiaVe from "../models/giaVe.model.js";

// ✅ Tạo mới giá vé (có thể kèm chi tiết)
export const createGiaVe = async (req, res) => {
  try {
    const giaVe = new GiaVe(req.body);
    await giaVe.save();
    res.status(201).json(giaVe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Lấy tất cả giá vé
export const getAllGiaVe = async (req, res) => {
  try {
    const giaVes = await GiaVe.find();

    res.json(giaVes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy 1 giá vé theo ID
export const getGiaVeById = async (req, res) => {
  try {
    const giaVe = await GiaVe.findById(req.params.id);

    if (!giaVe) return res.status(404).json({ error: "Không tìm thấy giá vé" });
    res.json(giaVe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Cập nhật giá vé
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

// ✅ Xóa giá vé
export const deleteGiaVe = async (req, res) => {
  try {
    const giaVe = await GiaVe.findByIdAndDelete(req.params.id);
    if (!giaVe) return res.status(404).json({ error: "Không tìm thấy giá vé" });
    res.json({ message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Thêm chi tiết giá vé vào 1 giá vé
export const addChiTietGiaVe = async (req, res) => {
  try {
    const giaVe = await GiaVe.findById(req.params.id);
    if (!giaVe) return res.status(404).json({ error: "Không tìm thấy giá vé" });

    giaVe.chiTietGiaVe.push(req.body);
    await giaVe.save();

    res.json(giaVe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Xóa chi tiết giá vé trong 1 giá vé
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
