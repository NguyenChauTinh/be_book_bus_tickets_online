import VaiTro from "../models/vaiTro.model.js";
import Quyen from "../models/phanQuyen.model.js";


export const taoVaiTro = async (req, res) => {
  try {
    const { maVaiTro, tenVaiTro, phanQuyen } = req.body;
    const vaiTroDaTonTai = await VaiTro.findOne({ $or: [{ maVaiTro }, { tenVaiTro }] });
    if (vaiTroDaTonTai) {
      return res.status(409).json({
        success: false,
        message: "Mã vai trò hoặc tên vai trò đã tồn tại.",
      });
    }

    if (phanQuyen && phanQuyen.length > 0) {
      const quyenHopLe = await Quyen.find({ _id: { $in: phanQuyen } });
      if (quyenHopLe.length !== phanQuyen.length) {
        return res.status(400).json({
          success: false,
          message: "Một hoặc nhiều mã phân quyền không hợp lệ hoặc không tồn tại.",
        });
      }
    }
    const vaiTroMoi = await VaiTro.create({ maVaiTro, tenVaiTro, phanQuyen });
    res.status(201).json({
      success: true,
      message: "Tạo vai trò thành công!",
      data: vaiTroMoi,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo vai trò.",
      error: error.message,
    });
  }
};

export const chinhSuaVaiTro = async (req, res) => {
  try {
    const { id } = req.params;
    const { maVaiTro, tenVaiTro, phanQuyen, active } = req.body;

    const vaiTro = await VaiTro.findById(id);
    if (!vaiTro) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vai trò để cập nhật.",
      });
    }

    if (maVaiTro && maVaiTro !== vaiTro.maVaiTro) {
      const maDaTonTai = await VaiTro.findOne({ maVaiTro });
      if (maDaTonTai) {
        return res.status(409).json({ success: false, message: "Mã vai trò đã tồn tại." });
      }
    }
    if (tenVaiTro && tenVaiTro !== vaiTro.tenVaiTro) {
      const tenDaTonTai = await VaiTro.findOne({ tenVaiTro });
      if (tenDaTonTai) {
        return res.status(409).json({ success: false, message: "Tên vai trò đã tồn tại." });
      }
    }

    if (phanQuyen && phanQuyen.length > 0) {
      const quyenHopLe = await Quyen.find({ _id: { $in: phanQuyen } });
      if (quyenHopLe.length !== phanQuyen.length) {
        return res.status(400).json({
          success: false,
          message: "Một hoặc nhiều mã phân quyền không hợp lệ hoặc không tồn tại.",
        });
      }
    }

    vaiTro.maVaiTro = maVaiTro || vaiTro.maVaiTro;
    vaiTro.tenVaiTro = tenVaiTro || vaiTro.tenVaiTro;
    vaiTro.phanQuyen = phanQuyen || vaiTro.phanQuyen;
    if (typeof active === 'boolean') {
      vaiTro.active = active;
    }
    const vaiTroCapNhat = await vaiTro.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật vai trò thành công!",
      data: vaiTroCapNhat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật vai trò.",
      error: error.message,
    });
  }
};


export const timVaiTro = async (req, res) => {
  try {
    const { id } = req.params;
    let ketQua;

    if (id) {
      ketQua = await VaiTro.findById(id).populate('phanQuyen');
      if (!ketQua) {
        return res.status(404).json({ success: false, message: "Không tìm thấy vai trò." });
      }
    } else {
      const { ...query } = req.query;
      ketQua = await VaiTro.find(query).populate('phanQuyen');
    }

    res.status(200).json({
      success: true,
      message: "Tìm kiếm thành công.",
      count: id ? 1 : ketQua.length,
      data: ketQua,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tìm kiếm vai trò.",
      error: error.message,
    });
  }
};