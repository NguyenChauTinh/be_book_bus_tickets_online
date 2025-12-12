import GiaVe from "../models/giaVe.model.js";
import mongoose from "mongoose";
import TuyenDuong from "../models/tuyenDuong.model.js"; 
import LoaiXe from "../models/loaiXe.model.js";

// --- HÀM HELPER: KIỂM TRA TRÙNG LẶP ---
const checkDuplicateTicketPrice = async (start, end, details, excludeId = null) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  // 1. Tìm các bảng giá có khoảng thời gian chồng lấn
  // Logic trùng: (Start_A <= End_B) và (End_A >= Start_B)
  const query = {
    active: true,
    thoiGianBatDau: { $lte: endDate },
    thoiGianKetThuc: { $gte: startDate },
  };

  // Nếu là update, loại trừ chính bản thân nó ra
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  // Lấy các bảng giá trùng ngày và populate để lấy tên Tuyến/Xe cho thông báo lỗi
  const conflictingPrices = await GiaVe.find(query).populate({
    path: "chiTietGiaVe.tuyenDuong chiTietGiaVe.loaiXe",
    select: "tenTuyen tenLoaiXe", // Chỉ lấy tên để hiển thị
  });

  // 2. Kiểm tra sâu vào chi tiết (Tuyến + Xe)
  for (const existingPrice of conflictingPrices) {
    // Duyệt qua từng chi tiết mới gửi lên
    for (const newDetail of details) {
      // Tìm xem chi tiết này có tồn tại trong bảng giá cũ không
      const match = existingPrice.chiTietGiaVe.find((existingDetail) => {
        // Lưu ý: existingDetail.tuyenDuong có thể là Object (do populate) hoặc ID string
        const existingTuyenId = existingDetail.tuyenDuong._id
          ? existingDetail.tuyenDuong._id.toString()
          : existingDetail.tuyenDuong.toString();
        const existingXeId = existingDetail.loaiXe._id
          ? existingDetail.loaiXe._id.toString()
          : existingDetail.loaiXe.toString();

        return (
          existingTuyenId === newDetail.tuyenDuong.toString() &&
          existingXeId === newDetail.loaiXe.toString()
        );
      });

      // Nếu tìm thấy trùng khớp
      if (match) {
        const fromDate = new Date(existingPrice.thoiGianBatDau).toLocaleDateString("vi-VN");
        const toDate = new Date(existingPrice.thoiGianKetThuc).toLocaleDateString("vi-VN");
        const routeName = match.tuyenDuong.tenTuyen || "Unknown Route";
        const vehicleName = match.loaiXe.tenLoaiXe || "Unknown Vehicle";

        return {
          isConflict: true,
          message: `Không thể lưu. Đã tồn tại giá vé từ ${fromDate} đến ${toDate} cho tuyến "${routeName}" - loại xe "${vehicleName}" (Mã giá vé: ${existingPrice.maGiaVe}).`,
        };
      }
    }
  }

  return { isConflict: false };
};

// --- CONTROLLERS ---

export const createGiaVe = async (req, res) => {
  try {
    const { thoiGianBatDau, thoiGianKetThuc, chiTietGiaVe } = req.body;

    // Kiểm tra trùng lặp
    const check = await checkDuplicateTicketPrice(
      thoiGianBatDau,
      thoiGianKetThuc,
      chiTietGiaVe
    );

    if (check.isConflict) {
      return res.status(400).json({ error: check.message });
    }

    const giaVe = new GiaVe(req.body);
    await giaVe.save();
    res.status(201).json(giaVe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateGiaVe = async (req, res) => {
  try {
    const { thoiGianBatDau, thoiGianKetThuc, chiTietGiaVe } = req.body;
    const { id } = req.params;

    // Kiểm tra trùng lặp (truyền id vào để loại trừ chính nó)
    const check = await checkDuplicateTicketPrice(
      thoiGianBatDau,
      thoiGianKetThuc,
      chiTietGiaVe,
      id
    );

    if (check.isConflict) {
      return res.status(400).json({ error: check.message });
    }

    const giaVe = await GiaVe.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!giaVe) return res.status(404).json({ error: "Không tìm thấy giá vé" });
    res.json(giaVe);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Các hàm khác giữ nguyên
export const getAllGiaVe = async (req, res) => {
  try {
    const giaVes = await GiaVe.find().populate({
        path: "chiTietGiaVe.tuyenDuong chiTietGiaVe.loaiXe",
        select: "tenTuyen tenLoaiXe"
    }).sort({ createdAt: -1 });

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

    // Kiểm tra conflict cho chi tiết mới thêm vào
    const check = await checkDuplicateTicketPrice(
        giaVe.thoiGianBatDau,
        giaVe.thoiGianKetThuc,
        [{ tuyenDuong, loaiXe }], // Tạo mảng chứa 1 item mới
        giaVe._id // Loại trừ chính bảng giá hiện tại (để so với các bảng giá KHÁC)
    );

    // Lưu ý: Logic trên chỉ check conflict với BẢNG GIÁ KHÁC.
    // Nếu muốn check xem trong chính bảng giá này đã có chưa:
    const duplicateInSelf = giaVe.chiTietGiaVe.find(
        ct => ct.tuyenDuong.toString() === tuyenDuong && ct.loaiXe.toString() === loaiXe
    );
    if(duplicateInSelf) {
        return res.status(400).json({ error: "Tuyến đường và loại xe này đã tồn tại trong bảng giá này." });
    }

    if (check.isConflict) {
        return res.status(400).json({ error: check.message });
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
    
    // Nếu đang định active lại (từ false -> true), cần kiểm tra xem có bị trùng không
    if (!giaVe.active) {
        const check = await checkDuplicateTicketPrice(
            giaVe.thoiGianBatDau,
            giaVe.thoiGianKetThuc,
            giaVe.chiTietGiaVe,
            giaVe._id
        );
        if (check.isConflict) {
            return res.status(400).json({ error: "Không thể kích hoạt lại. " + check.message });
        }
    }

    giaVe.active = !giaVe.active;
    await giaVe.save();
    res.json(giaVe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// giaVe.controller.js

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
        
        const dayIndex = currentDate.getDay(); 
        const currentDayVN = dayIndex === 0 ? "8" : (dayIndex + 1).toString();

        // 2. Tìm các bảng giá thỏa mãn điều kiện thời gian và active
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
        .sort({ updatedAt: -1 }); // Lấy cái mới cập nhật nhất trước

        // 3. Lọc lại theo logic tuanSuat (weekdays) và ngayApDung
        // Mongoose trả về array, ta dùng JS để filter
        const validBangGia = cacBangGiaPhuHop.filter(giaVe => {
            // Nếu tần suất là 'all' -> Luôn đúng
            if (giaVe.tuanSuat === 'all') return true;

            // Nếu tần suất là 'weekdays' -> Check xem ngày hiện tại có được bật true không
            if (giaVe.tuanSuat === 'weekdays') {
                // Kiểm tra object ngayApDung. Ví dụ: { "2": true, "3": true, "7": false }
                // Nếu không tồn tại ngayApDung hoặc ngày đó không true -> Loại
                if (giaVe.ngayApDung && giaVe.ngayApDung[currentDayVN] === true) {
                    return true;
                }
                return false;
            }
            
            return false;
        });

        if (validBangGia.length === 0) {
            return res.status(200).json({ 
                success: false, 
                message: "Không tìm thấy giá vé phù hợp cho ngày này (do cấu hình thứ trong tuần)." 
            });
        }

        // Lấy bảng giá ưu tiên nhất sau khi lọc
        const bangGiaMoiNhat = validBangGia[0];

        const chiTietPhuHop = bangGiaMoiNhat.chiTietGiaVe.find(
            (ct) =>
                ct.tuyenDuong.toString() === tuyenDuongId &&
                ct.loaiXe.toString() === loaiXeId
        );

        if (!chiTietPhuHop) {
            return res.status(500).json({ success: false, message: "Lỗi logic: Không tìm thấy chi tiết giá vé." });
        }

        res.json({ success: true, soTienThanhToan: chiTietPhuHop.soTienThanhToan });

    } catch (err) {
        console.error("Lỗi khi tìm giá vé áp dụng:", err);
        res.status(500).json({ success: false, message: "Lỗi máy chủ khi tìm giá vé.", details: err.message });
    }
};