import KhuyenMai from "../models/khuyenMai.model.js";

const timeStringToMinutes = (timeStr) => {
  if (typeof timeStr !== "string" || !timeStr.match(/^\d{2}:\d{2}$/)) {
    return timeStr;
  }
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};
const processTimeConditions = (body) => {
  if (body.lines && Array.isArray(body.lines)) {
    const newLines = body.lines.map((line) => {
      if (line.dieuKienApDung && Array.isArray(line.dieuKienApDung)) {
        line.dieuKienApDung.forEach((condition) => {
          if (condition.loaiDieuKien === "GIO_THAP_DIEM") {
            if (condition.gioBatDau) {
              condition.gioBatDau = timeStringToMinutes(condition.gioBatDau);
            }
            if (condition.gioKetThuc) {
              condition.gioKetThuc = timeStringToMinutes(condition.gioKetThuc);
            }
          }
        });
      }
    });
  }
  return body;
};
export const taoKhuyenMai = async (req, res) => {
  try {
    let processedBody = req.body;

    const hasThapDiemCondition = req.body.lines.some((line) =>
      line.dieuKienApDung.some(
        (condition) => condition.loaiDieuKien === "GIO_THAP_DIEM"
      )
    );

    if (hasThapDiemCondition) {
      processedBody = processTimeConditions(req.body);
    }

    const newKhuyenMai = new KhuyenMai(processedBody);
    const khuyenMai = await newKhuyenMai.save();
    res
      .status(201)
      .json({
        success: true,
        message: "Thêm khuyến mãi thành công.",
        data: khuyenMai,
      });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Mã khuyến mãi đã tồn tại.",
          error: err.message,
        });
    }
    res
      .status(500)
      .json({
        success: false,
        message: "Lỗi khi thêm khuyến mãi.",
        error: err.message,
      });
  }
};

export const capNhatKhuyenMai = async (req, res) => {
  try {
    const { id } = req.params;
    let processedBody = req.body;

    const hasThapDiemCondition = req.body.lines.some((line) =>
      line.dieuKienApDung.some(
        (condition) => condition.loaiDieuKien === "GIO_THAP_DIEM"
      )
    );

    if (hasThapDiemCondition) {
      processedBody = processTimeConditions(req.body);
    }

    const khuyenMai = await KhuyenMai.findByIdAndUpdate(id, processedBody, {
      new: true,
      runValidators: true,
    });
    if (!khuyenMai) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Không tìm thấy khuyến mãi để cập nhật.",
        });
    }
    res
      .status(200)
      .json({
        success: true,
        message: "Cập nhật khuyến mãi thành công.",
        data: khuyenMai,
      });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Lỗi khi cập nhật khuyến mãi.",
        error: err.message,
      });
  }
};

export const voHieuHoaKhuyenMai = async (req, res) => {
  try {
    const { id } = req.params;
    const khuyenMai = await KhuyenMai.findByIdAndUpdate(
      id,
      { trangThai: false },
      { new: true }
    );
    if (!khuyenMai) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Không tìm thấy khuyến mãi để vô hiệu hóa.",
        });
    }
    res
      .status(200)
      .json({
        success: true,
        message: "Vô hiệu hóa khuyến mãi thành công.",
        data: khuyenMai,
      });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Lỗi khi vô hiệu hóa khuyến mãi.",
        error: err.message,
      });
  }
};

export const khoiPhucKhuyenMai = async (req, res) => {
  try {
    const { id } = req.params;
    const khuyenMai = await KhuyenMai.findByIdAndUpdate(
      id,
      { trangThai: true },
      { new: true }
    );
    if (!khuyenMai) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Không tìm thấy khuyến mãi để khôi phục.",
        });
    }
    res
      .status(200)
      .json({
        success: true,
        message: "Khôi phục khuyến mãi thành công.",
        data: khuyenMai,
      });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Lỗi khi khôi phục khuyến mãi.",
        error: err.message,
      });
  }
};

export const timKhuyenMai = async (req, res) => {
  try {
    const { trangThai, searchTerm } = req.query;
    let query = {};

    if (trangThai !== undefined) {
      query.trangThai = trangThai === "true";
    }

    if (searchTerm) {
      query.$or = [
        { maKhuyenMai: { $regex: searchTerm, $options: "i" } },
        { tenKhuyenMai: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const khuyenMais = await KhuyenMai.find(query);
    res.status(200).json({ success: true, data: khuyenMais });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Lỗi khi tìm kiếm khuyến mãi.",
        error: err.message,
      });
  }
};

export const layKhuyenMaiTheoId = async (req, res) => {
  try {
    const khuyenMai = await KhuyenMai.findById(req.params.id);
    if (!khuyenMai) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy khuyến mãi." });
    }
    res.status(200).json({ success: true, data: khuyenMai });
  } catch (err) {
    res
      .status(500)
      .json({
        success: false,
        message: "Lỗi khi lấy thông tin khuyến mãi.",
        error: err.message,
      });
  }
};
//Hàm khuyến mãi áp dụng
// export const timKhuyenMaiApDung = async (req, res) => {
//     try {
//         const { ngay, gio } = req.query; 

//         const ngayChay = new Date(ngay);
//         const gioChay = parseInt(gio, 10);
//         // console.log('ngayChay:', ngayChay, 'gioChay:', gioChay);

//         const khuyenMaiCoHieuLuc = await KhuyenMai.find({
//             trangThai: true,
//             ngayBatDau: { $lte: ngayChay },
//             ngayKetThuc: { $gte: ngayChay },
//         });

//         if (!khuyenMaiCoHieuLuc.length) {
//             return res.json({ success: true, data: [] }); 
//         }

//         const khuyenMaiApDung = khuyenMaiCoHieuLuc.filter(km => {
//             return km.lines.some(line => {
//                 if (!line.trangThai) return false; 

//                 if (!line.dieuKienApDung || line.dieuKienApDung.length === 0) {
//                     return true;
//                 }

//                 return line.dieuKienApDung.every(dk => {
//                     switch (dk.loaiDieuKien) {
//                         case 'GIO_THAP_DIEM':
//                           console.log('Checking GIO_THAP_DIEM with gioBatDau:', dk.gioBatDau, 'gioKetThuc:', dk.gioKetThuc, 'ket qua:', gioChay >= dk.gioBatDau && gioChay <= dk.gioKetThuc);
//                             return gioChay >= dk.gioBatDau && gioChay <= dk.gioKetThuc;
                        
//                         default:
//                             return false; 
//                     }
//                 });
//             });
//         });

//         res.json({ success: true, data: khuyenMaiApDung });

//     } catch (err) {
//         res.status(500).json({ error: "Lỗi máy chủ khi tìm khuyến mãi.", details: err.message });
//     }
// };
export const timKhuyenMaiApDung = async (req, res) => {
    try {
        const { ngay, gio, soLuongVe, loaiHanhTrinh, datLanDau } = req.query;

        const ngayChay = new Date(ngay);
        const gioChay = parseInt(gio, 10);
        const soLuongVeChay = soLuongVe ? parseInt(soLuongVe, 10) : null;
        const loaiHanhTrinhChay = loaiHanhTrinh; 
        const datLanDauChay = datLanDau === 'true'; 



        const khuyenMaiCoHieuLuc = await KhuyenMai.find({
            trangThai: true,
            ngayBatDau: { $lte: ngayChay },
            ngayKetThuc: { $gte: ngayChay },
        });

        if (!khuyenMaiCoHieuLuc.length) {
            return res.json({ success: true, data: [] });
        }

        const khuyenMaiApDung = khuyenMaiCoHieuLuc.filter(km => {
            return km.lines.some(line => {
                if (!line.trangThai) return false;

                if (!line.dieuKienApDung || line.dieuKienApDung.length === 0) {
                    return true; 
                }

                return line.dieuKienApDung.every(dk => {
                    switch (dk.loaiDieuKien) {
                        case 'GIO_THAP_DIEM':
                            if (isNaN(gioChay)) return false; 
                            return gioChay >= dk.gioBatDau && gioChay <= dk.gioKetThuc;

                        case 'SO_LUONG_VE':
                            if (!soLuongVeChay || isNaN(soLuongVeChay)) return false;
                            return soLuongVeChay >= dk.soLuongToiThieu;

                        case 'LOAI_HANH_TRINH':
                            if (!loaiHanhTrinhChay) return false;
                            return loaiHanhTrinhChay === dk.loaiHanhTrinh;
                        
                        case 'DAT_LAN_DAU':
                            return datLanDauChay === true;
                        
                        default:
                            return false;
                    }
                });
            });
        });

        res.json({ success: true, data: khuyenMaiApDung });

    } catch (err) {
        res.status(500).json({ error: "Lỗi máy chủ khi tìm khuyến mãi.", details: err.message });
    }
};