import TuyenDuong from "../models/tuyenDuong.model.js";
import ChiTietTuyenDuong from "../models/chiTietTuyenDuong.model.js";
import mongoose from "mongoose";

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

    // tạo tuyến đường
    const tuyen = await TuyenDuong.create({
      maTuyen,
      tenTuyen,
      khoangCachTuyenDuong,
      thoiGian,
      ghiChu,
    });

    // nếu có chi tiết kèm theo
    if (Array.isArray(chiTiet) && chiTiet.length > 0) {
      const chiTietDocs = await ChiTietTuyenDuong.insertMany(
        chiTiet.map((ct) => ({
          tuyenDuong: tuyen._id,
          diaDiem: new mongoose.Types.ObjectId(
            typeof ct.diaDiem === "object" ? ct.diaDiem._id : ct.diaDiem
          ),
          thuTu: ct.thuTu,
          loaiDiem: ct.loaiDiem,
          khoangCach: ct.khoangCach,
          thoiGianDuKien: ct.thoiGianDuKien,
        }))
      );

      tuyen.chiTietTuyen = chiTietDocs.map((d) => d._id);
      await tuyen.save();
    }

    // trả về đầy đủ tuyến đường + chi tiết
    const populated = await TuyenDuong.findById(tuyen._id).populate(
      "chiTietTuyen"
    );

    res.status(201).json(populated);
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

    console.log("PARAM:", req.params);
    console.log("BODY:", req.body);

    const tuyen = await TuyenDuong.findById(id);
    if (!tuyen) return res.status(404).json({ error: "Không tìm thấy tuyến" });

    tuyen.maTuyen = maTuyen ?? tuyen.maTuyen;
    tuyen.tenTuyen = tenTuyen ?? tuyen.tenTuyen;
    tuyen.khoangCachTuyenDuong =
      khoangCachTuyenDuong ?? tuyen.khoangCachTuyenDuong;
    tuyen.thoiGian = thoiGian ?? tuyen.thoiGian;
    tuyen.ghiChu = ghiChu ?? tuyen.ghiChu;

    if (chiTiet?.length) {
      // Xóa chi tiết cũ
      await ChiTietTuyenDuong.deleteMany({ tuyenDuong: tuyen._id });

      // Thêm chi tiết mới
      const chiTietDocs = await ChiTietTuyenDuong.insertMany(
        chiTiet.map((ct) => ({
          tuyenDuong: tuyen._id,
          diaDiem: mongoose.isValidObjectId(ct.diaDiem?._id || ct.diaDiem)
            ? new mongoose.Types.ObjectId(ct.diaDiem?._id || ct.diaDiem)
            : null,
          thuTu: ct.thuTu,
          loaiDiem: ct.loaiDiem,
          khoangCach: ct.khoangCach,
          thoiGianDuKien: ct.thoiGianDuKien,
        }))
      );
      tuyen.chiTietTuyen = chiTietDocs.map((d) => d._id);
    }

    await tuyen.save();

    const updated = await TuyenDuong.findById(tuyen._id).populate(
      "chiTietTuyen"
    );
    res.json(updated);
  } catch (err) {
    console.error("❌ Lỗi cập nhật tuyến:", err);
    res.status(400).json({ error: err.message });
  }
};

export const getTuyenDuong = async (req, res) => {
  try {
    const tuyen = await TuyenDuong.findById(req.params.id).populate({
      path: "chiTietTuyen",
      // ✅ Sắp xếp các điểm dừng theo thứ tự
      options: { sort: { thuTu: 1 } },
      populate: {
        path: "diaDiem",
        // ✅ Cần lấy thêm 'diaChi' và 'tenDiaDiem' để trả về cho frontend
        select: "tenDiaDiem diaChi",
      },
    });

    if (!tuyen) {
      // ✅ Sửa Lỗi 1: Gói response lỗi
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tuyến" });
    }

    // ✅ Sửa Lỗi 2: Biến đổi dữ liệu
    if (!tuyen.chiTietTuyen || tuyen.chiTietTuyen.length < 2) {
      // Tuyến đường phải có ít nhất 2 điểm (đi và đến)
      return res.status(400).json({
        success: false,
        message: "Tuyến đường không có đủ chi tiết điểm đi/đến",
      });
    }

    // Lấy điểm đầu tiên làm điểm đón
    const diemDonChiTiet = tuyen.chiTietTuyen[0];
    // Lấy điểm cuối cùng làm điểm trả
    const diemTraChiTiet = tuyen.chiTietTuyen[tuyen.chiTietTuyen.length - 1];

    // Tạo object mới có cấu trúc (shape) mà frontend mong đợi
    const formattedTuyen = {
      _id: tuyen._id,
      tenTuyen: tuyen.tenTuyen,
      thoiGianDenDuKien: diemTraChiTiet.thoiGianDenDuKien || 0,

      diemDon: {
        // ⚠️ Giả định: 'diaDiem' trả về 'tenDiaDiem' và 'diaChi'
        tenDiem: diemDonChiTiet.diaDiem?.tenDiaDiem || "Không rõ điểm đón",
        diaChi: diemDonChiTiet.diaDiem?.diaChi || "Không rõ địa chỉ",
      },
      diemTra: {
        tenDiem: diemTraChiTiet.diaDiem?.tenDiaDiem || "Không rõ điểm trả",
        diaChi: diemTraChiTiet.diaDiem?.diaChi || "Không rõ địa chỉ",
      },
    };
    res.status(200).json({
      success: true,
      message: "Lấy tuyến đường thành công",
      data: formattedTuyen,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Lỗi máy chủ: " + err.message,
    });
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

export const getDiaDiemKetNoi = async (req, res) => {
  try {
    const { selectedId, type } = req.query;

    const allRoutes = await TuyenDuong.find({ active: true })
      .populate({
        path: "chiTietTuyen",
        populate: { path: "diaDiem", select: "maDiaDiem tenDiaDiem" },
      })
      .lean();

    const diaDiemMap = new Map();
    const validDonTypes = ["don", "trunggian"];
    const validTraTypes = ["tra", "trunggian"];

    if (!selectedId || selectedId === "undefined") {
      if (type === "don") {
        allRoutes.forEach((route) => {
          route.chiTietTuyen.forEach((stop) => {
            if (
              stop.diaDiem &&
              validDonTypes.includes(stop.loaiDiem?.trim()) &&
              !diaDiemMap.has(stop.diaDiem._id.toString())
            ) {
              diaDiemMap.set(stop.diaDiem._id.toString(), stop.diaDiem);
            }
          });
        });
      } else if (type === "tra") {
        // Lấy tất cả điểm TRẢ ban đầu
        console.log("[API DEBUG] Finding initial 'tra' locations.");
        allRoutes.forEach((route) => {
          console.log(`[API DEBUG] Checking route: ${route.tenTuyen}`);
          route.chiTietTuyen.forEach((stop) => {
            if (
              stop.diaDiem &&
              validTraTypes.includes(stop.loaiDiem?.trim()) &&
              !diaDiemMap.has(stop.diaDiem._id.toString())
            ) {
              diaDiemMap.set(stop.diaDiem._id.toString(), stop.diaDiem);
            }
          });
        });
      }
    } else if (type === "don") {
      // TRƯỜNG HỢP 2: Đã chọn điểm TRẢ (selectedId) -> Tìm điểm ĐÓN

      allRoutes.forEach((route) => {
        const chiTiet = route.chiTietTuyen;
        const diemTraIndex = chiTiet.findIndex(
          (stop) =>
            stop.diaDiem?._id.toString() === selectedId &&
            validTraTypes.includes(stop.loaiDiem?.trim())
        );

        if (diemTraIndex > -1) {
          for (let i = 0; i < diemTraIndex; i++) {
            const prevStop = chiTiet[i];
            if (
              prevStop.diaDiem &&
              validDonTypes.includes(prevStop.loaiDiem?.trim()) &&
              !diaDiemMap.has(prevStop.diaDiem._id.toString())
            ) {
              diaDiemMap.set(prevStop.diaDiem._id.toString(), prevStop.diaDiem);
            }
          }
        }
      });
    } else if (type === "tra") {
      // TRƯỜNG HỢP 3: Đã chọn điểm ĐÓN (selectedId) -> Tìm điểm TRẢ

      allRoutes.forEach((route) => {
        const chiTiet = route.chiTietTuyen;
        const diemDonIndex = chiTiet.findIndex(
          (stop) =>
            stop.diaDiem?._id.toString() === selectedId &&
            validDonTypes.includes(stop.loaiDiem?.trim())
        );

        if (diemDonIndex > -1) {
          for (let i = diemDonIndex + 1; i < chiTiet.length; i++) {
            const nextStop = chiTiet[i];
            if (
              nextStop.diaDiem &&
              validTraTypes.includes(nextStop.loaiDiem?.trim()) &&
              !diaDiemMap.has(nextStop.diaDiem._id.toString())
            ) {
              diaDiemMap.set(nextStop.diaDiem._id.toString(), nextStop.diaDiem);
            }
          }
        }
      });
    } // Chuyển Map thành Array để trả về JSON

    const result = Array.from(diaDiemMap.values());
    console.log(`[API END] Found ${result.length} locations.`);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("Lỗi khi tìm địa điểm kết nối:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
