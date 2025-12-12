import LoaiXe from "../models/loaiXe.model.js";
import redisClient from "../config/redis.js";
const REDIS_KEY = "danhsachloaixe";
export const createLoaiXe = async (req, res) => {
  try {
    const { maLoaiXe, tenLoaiXe, moTa, trangThai, soDoGhe, soLuongGhe } =
      req.body;

    if (!Array.isArray(soDoGhe) || soDoGhe.length === 0) {
      return res.status(400).json({
        message:
          "Sơ đồ ghế (soDoGhe) là bắt buộc và phải là một mảng không rỗng.",
      });
    }

    const newLoaiXe = new LoaiXe({
      maLoaiXe,
      tenLoaiXe,
      moTa,
      trangThai,
      soDoGhe,
      soLuongGhe,
    });

    await newLoaiXe.save();
    await redisClient.del(REDIS_KEY);
    res.status(201).json({
      message: "Tạo loại xe thành công",
      data: newLoaiXe,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Mã loại xe đã tồn tại" });
    }
    res.status(500).json({
      message: "Đã xảy ra lỗi khi tạo loại xe",
      error: error.message,
    });
  }
};

export const updateLoaiXe = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenLoaiXe, moTa, soDoGhe } = req.body;

    const updatedLoaiXe = await LoaiXe.findByIdAndUpdate(
      id,
      {
        tenLoaiXe,
        moTa,
        soDoGhe,
      },
      { new: true, runValidators: true }
    );

    if (!updatedLoaiXe) {
      return res.status(404).json({ message: "Không tìm thấy loại xe." });
    }
    await redisClient.del(REDIS_KEY);

    res.status(200).json({
      message: "Cập nhật loại xe thành công",
      data: updatedLoaiXe,
    });
  } catch (error) {
    res.status(500).json({
      message: "Đã xảy ra lỗi khi cập nhật loại xe",
      error: error.message,
    });
  }
};

export const de_reactivateLoaiXe = async (req, res) => {
  try {
    const { id } = req.params;
    const { trangThai } = req.body;

    if (typeof trangThai !== "boolean") {
      return res
        .status(400)
        .json({ message: 'Thuộc tính "trangThai" phải là boolean.' });
    }

    const updatedLoaiXe = await LoaiXe.findByIdAndUpdate(
      id,
      { trangThai },
      { new: true }
    );

    if (!updatedLoaiXe) {
      return res.status(404).json({ message: "Không tìm thấy loại xe." });
    }

    const action = trangThai ? "khôi phục" : "vô hiệu hóa";

    await redisClient.del(REDIS_KEY);

    res.status(200).json({
      message: `Loại xe đã được ${action} thành công`,
      data: updatedLoaiXe,
    });
  } catch (error) {
    res.status(500).json({
      message: `Đã xảy ra lỗi khi cập nhật trạng thái loại xe`,
      error: error.message,
    });
  }
};

export const getAllLoaiXe = async (req, res) => {
  const { trangThai } = req.query;

  try {
    let allLoaiXes = [];
    let cached = true;

    const cachedData = await redisClient.get(REDIS_KEY);

    if (cachedData) {
      const parsedObj = JSON.parse(cachedData);
      allLoaiXes = parsedObj.data;
    } else {
      allLoaiXes = await LoaiXe.find();
      cached = false;

      if (allLoaiXes) {
        await redisClient.set(REDIS_KEY, JSON.stringify({ data: allLoaiXes }), {
          EX: 24 * 3600,
        });
      }
    }

    let finalData = allLoaiXes;

    if (trangThai !== undefined) {
      const isTrangThai = trangThai === "true";
      finalData = allLoaiXes.filter((x) => x.trangThai === isTrangThai);
    }

    res.status(200).json({ data: finalData , cached});
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách loại xe",
      error: error.message,
    });
  }
};
