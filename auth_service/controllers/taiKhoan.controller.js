import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import TaiKhoan from "../models/taiKhoanNhanVien.model.js";
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
  SESSION_EXPIRY_SECONDS,
} from "../config/env.js";
import "../models/nhanVien.model.js";
import "../models/vaiTro.model.js";
import "../models/phanQuyen.model.js";
import NhanVien from "../models/nhanVien.model.js";
import redisClient from "../config/redis.js";

const signToken = (userId, tenTaiKhoan, nhanVienId) => {
  return jwt.sign({ userId, tenTaiKhoan, nhanVienId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const signRefreshToken = (userId) => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
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
    const refreshToken = signRefreshToken(taiKhoan._id);

    const sessionKey = `session:${taiKhoan._id}`;

    await redisClient.set(sessionKey, "active", {
      EX: SESSION_EXPIRY_SECONDS,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      data: {
        taiKhoan,
        accessToken: token,
        refreshToken: refreshToken,
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
export const doiMatKhau = async (req, res) => {
  try {
    const { id } = req.params;
    const { matKhauHienTai, matKhauMoi } = req.body;

    const taiKhoan = await TaiKhoan.findById(id).select("+matKhau"); // Đảm bảo lấy trường mật khẩu

    if (!taiKhoan) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản.",
      });
    }

    if (!matKhauHienTai) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp mật khẩu hiện tại.",
      });
    }

    const matKhauChinhXac = await bcrypt.compare(
      matKhauHienTai,
      taiKhoan.matKhau
    );

    if (!matKhauChinhXac) {
      return res.status(401).json({
        success: false,
        message: "Mật khẩu hiện tại không chính xác.",
      });
    }

    if (!matKhauMoi) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp mật khẩu mới.",
      });
    }

    taiKhoan.matKhau = matKhauMoi;

    await taiKhoan.save(); // Lưu và tự động hash mật khẩu mới

    res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đổi mật khẩu.",
      error: error.message,
    });
  }
};
export const chinhSuaTaiKhoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenTaiKhoan, trangThai, vaiTro, donViCongTac, xacThuc } = req.body;

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
    if (xacThuc !== undefined) {
      taiKhoan.xacThuc = xacThuc;
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
export const layDanhSachTaiKhoanPhongVe = async (req, res) => {
  try {
    // 1. Lấy ID của các nhân viên thuộc 'PHONGVE'
    const phongVeNhanViens = await NhanVien.find(
      { loaiNhanVien: "PHONGVE" },
      "_id"
    );

    // 2. Chuyển thành mảng các ID
    const phongVeNhanVienIds = phongVeNhanViens.map((nv) => nv._id);

    const taiKhoans = await TaiKhoan.find({
      nhanVien: { $in: phongVeNhanVienIds },
      trangThai: true,
    })
      .populate("nhanVien", "tenNhanVien")
      .select("tenTaiKhoan nhanVien donViCongTac");

    res.status(200).json({
      success: true,
      data: taiKhoans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách tài khoản phòng vé.",
      error: error.message,
    });
  }
};
// export const refreshToken = async (req, res) => {
//   try {
//     const { refreshToken } = req.body;

//     if (!refreshToken) {
//       return res.status(401).json({
//         success: false,
//         message: "Không tìm thấy Refresh Token.",
//       });
//     }

//     const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

//     const userId = decoded.userId;
//     const sessionKey = `session:${userId}`;
//     const sessionExists = await redisClient.get(sessionKey);

//     if (!sessionExists) {
//       res.clearCookie("refreshToken", {
//         httpOnly: true,
//         sameSite: "strict",
//         secure: true,
//       });
//       return res.status(403).json({
//         success: false,
//         message: "Phiên đăng nhập không hợp lệ hoặc đã kết thúc.",
//       });
//     }

//     const newAccessToken = jwt.sign({ userId: userId }, JWT_SECRET, {
//       expiresIn: JWT_EXPIRES_IN,
//     });

//     res.status(200).json({
//       success: true,
//       accessToken: newAccessToken,
//     });
//   } catch (error) {
//     if (error.name === "TokenExpiredError") {
//       return res.status(403).json({
//         success: false,
//         message: "Refresh Token đã hết hạn. Vui lòng đăng nhập lại.",
//       });
//     }
//     return res
//       .status(403)
//       .json({ success: false, message: "Refresh Token không hợp lệ." });
//   }
// };

export const refreshToken = async (req, res) => {
  try {
    // 1. Lấy Refresh Token từ Cookie (HttpOnly)
    const cookies = req.cookies;

    if (!cookies || !cookies.refreshToken) {
      return res.status(401).json({
        success: false,
        message:
          "Bạn chưa đăng nhập hoặc phiên đã hết hạn (Không tìm thấy Refresh Token).",
      });
    }

    const refreshToken = cookies.refreshToken;

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // Đảm bảo user chưa logout hoặc chưa bị cấm
    const userId = decoded.userId;
    const sessionKey = `session:${userId}`;
    const sessionExists = await redisClient.get(sessionKey);

    if (!sessionExists) {
      // Nếu Redis không còn key -> User đã logout -> Xóa cookie luôn
      res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "None",
        secure: true,
        path: "/",
      });
      return res.status(403).json({
        success: false,
        message: "Phiên đăng nhập không hợp lệ hoặc đã kết thúc.",
      });
    }

    const newAccessToken = jwt.sign({ userId: userId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // 5. (Tùy chọn nâng cao) Token Rotation: Đổi luôn cả Refresh Token mới
    // Giúp bảo mật hơn: Nếu refresh token cũ bị lộ, nó chỉ dùng được 1 lần
    /*
        const newRefreshToken = jwt.sign(
            { userId: userId }, 
            process.env.REFRESH_TOKEN_SECRET, 
            { expiresIn: '7d' } 
        );

        // Ghi đè cookie cũ
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
        });
        */
    const taiKhoan = await TaiKhoan.findById(userId).populate([
      { path: "nhanVien" },
      {
        path: "vaiTro",
        populate: {
          path: "phanQuyen",
          model: "Quyen",
        },
      },
    ]);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      taiKhoan: taiKhoan,
    });
  } catch (error) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    if (error.name === "TokenExpiredError") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Refresh Token đã hết hạn. Vui lòng đăng nhập lại.",
        });
    }
    return res
      .status(403)
      .json({ success: false, message: "Refresh Token không hợp lệ." });
  }
};
