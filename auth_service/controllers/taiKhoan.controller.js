import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import TaiKhoan from "../models/taiKhoanNhanVien.model.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";
import "../models/nhanVien.model.js";
import "../models/vaiTro.model.js";
import "../models/phanQuyen.model.js";

const signToken = (id, tenTaiKhoan, nhanVienId) => {
  return jwt.sign({ id, tenTaiKhoan, nhanVienId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const dangKy = async (req, res) => {
  try {
    const { tenTaiKhoan, matKhau, nhanVien, vaiTro, donViCongTac } = req.body;

    const taiKhoanDaTonTai = await TaiKhoan.findOne({ tenTaiKhoan });
    if (taiKhoanDaTonTai) {
      return res.status(409).json({
        success: false,
        message: "Tên tài khoản đã tồn tại.",
      });
    }
    const nhanVienDaCoTaiKhoan = await TaiKhoan.findOne({ nhanVien });
    if (nhanVienDaCoTaiKhoan) {
      return res.status(409).json({
        success: false,
        message: "Nhân viên này đã có tài khoản.",
      });
    }

    const taiKhoanMoi = await TaiKhoan.create({
      tenTaiKhoan,
      matKhau,
      nhanVien,
      vaiTro,
      donViCongTac,
    });

    const token = signToken(
      taiKhoanMoi._id,
      taiKhoanMoi.tenTaiKhoan,
      taiKhoanMoi.nhanVien,
      taiKhoanMoi.donViCongTac,
      taiKhoanMoi.vaiTro
    );

    res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công!",
      data: {
        taiKhoan: taiKhoanMoi,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng ký tài khoản.",
      error: error.message,
    });
  }
};

export const dangNhap = async (req, res) => {
  try {
    const { tenTaiKhoan, matKhau } = req.body;

    const taiKhoan = await TaiKhoan.findOne({ tenTaiKhoan }).populate([
      { path: "nhanVien" },
      {
        path: "vaiTro",
        populate: {
          path: "phanQuyen",
          model: "Quyen",
        },
      },
    ]);
    if (!taiKhoan || !taiKhoan.trangThai) {
      return res.status(401).json({
        success: false,
        message: "Tên tài khoản không tồn tại hoặc tài khoản đã bị khóa.",
      });
    }
    const matKhauChinhXac = await bcrypt.compare(matKhau, taiKhoan.matKhau);
    if (!matKhauChinhXac) {
      return res.status(401).json({
        success: false,
        message: "Sai mật khẩu.",
      });
    }

    const token = signToken(
      taiKhoan._id,
      taiKhoan.tenTaiKhoan,
      taiKhoan.nhanVien
    );
    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      data: {
        taiKhoan,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng nhập.",
      error: error.message,
    });
  }
};

export const chinhSuaTaiKhoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenTaiKhoan, matKhau, trangThai, vaiTro, donViCongTac } = req.body;

    const taiKhoan = await TaiKhoan.findById(id);

    if (!taiKhoan) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản để cập nhật.",
      });
    }

    if (tenTaiKhoan && tenTaiKhoan !== taiKhoan.tenTaiKhoan) {
      const tenTaiKhoanDaTonTai = await TaiKhoan.findOne({ tenTaiKhoan });
      if (tenTaiKhoanDaTonTai) {
        return res.status(409).json({
          success: false,
          message: "Tên tài khoản đã tồn tại.",
        });
      }
      taiKhoan.tenTaiKhoan = tenTaiKhoan;
    }

    if (matKhau) {
      taiKhoan.matKhau = matKhau;
    }

    if (vaiTro !== undefined) {
      taiKhoan.vaiTro = vaiTro;
    }
    if (donViCongTac) {
      taiKhoan.donViCongTac = donViCongTac;
    }

    taiKhoan.trangThai =
      trangThai !== undefined ? trangThai : taiKhoan.trangThai;

    const taiKhoanCapNhat = await taiKhoan.save();
    res.status(200).json({
      success: true,
      message: "Cập nhật tài khoản thành công!",
      data: taiKhoanCapNhat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật tài khoản.",
      error: error.message,
    });
  }
};

export const timTaiKhoan = async (req, res) => {
  try {
    const { id } = req.params;

    const ketQua = await TaiKhoan.findById(id).populate([
      { path: "nhanVien" },
      {
        path: "vaiTro",
        populate: {
          path: "phanQuyen",
          model: "Quyen",
        },
      },
    ]);

    if (!ketQua) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản với ID này.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Tìm kiếm thành công.",
      data: ketQua,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tìm kiếm tài khoản.",
      error: error.message,
    });
  }
};

export const layDanhSachTaiKhoan = async (req, res) => {
  try {
    const taiKhoans = await TaiKhoan.find().populate("nhanVien");

    res.status(200).json({
      success: true,
      data: taiKhoans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách tài khoản.",
      error: error.message,
    });
  }
};
