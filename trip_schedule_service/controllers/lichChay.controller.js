import LichChayMaster from "../models/lichChay.model.js";
import ChuyenXe from "../models/chuyenXe.model.js";

const isFrequencyMatch = (tanSuat, date) => {
  const dayOfMonth = date.getUTCDate();
  const dayOfWeek = date.getUTCDay();

  switch (tanSuat.loaiTanSuat) {
    case "HANG_NGAY":
      return true;
    case "THEO_NGAY_LE_CHAN":
      if (tanSuat.giaTri === "le") return dayOfMonth % 2 !== 0;
      if (tanSuat.giaTri === "chan") return dayOfMonth % 2 === 0;
      return false;
    case "THEO_NGAY_CU_THE":
      return tanSuat.giaTri.includes(dayOfMonth);
    case "THEO_THU_TRONG_TUAN":
      return tanSuat.giaTri.includes(dayOfWeek);
    default:
      return false;
  }
};
const timeStringToMinutes = (timeStr) => {
    if (typeof timeStr !== 'string' || !timeStr.match(/^\d{2}:\d{2}$/)) {
        return timeStr;
    }
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

const minutesToHHMM = (minutes) => {
    if (typeof minutes !== 'number') return "0000";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}${String(mins).padStart(2, '0')}`;
};

const processLichChayBody = (body) => {
    if (body.lines && Array.isArray(body.lines)) {
        body.lines.forEach(line => {
            if (line.gioKhoiHanh) {
                line.gioKhoiHanh = timeStringToMinutes(line.gioKhoiHanh);
            }
        });
    }
    return body;
};

const generateMaChuyenXe = (tuyenDuong, date, gioKhoiHanhPhut) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const time = minutesToHHMM(gioKhoiHanhPhut);
  return `${tuyenDuong}${day}${month}${year}${time}`;
};



const createChuyenXeHangLoat = async (masterSchedule, linesToProcess = masterSchedule.lines) => {
  const startDate = new Date(masterSchedule.ngayBatDau);
  const endDate = new Date(masterSchedule.ngayKetThuc);
  const dateIterator = new Date(startDate);
  const tripsToInsert = [];

  while (dateIterator <= endDate) {
    for (const line of linesToProcess) { 
      if (line.active && isFrequencyMatch(line.tanSuat, dateIterator)) {
        const tripCode = generateMaChuyenXe(
          masterSchedule.tuyenDuong,
          dateIterator,
          line.gioKhoiHanh 
        );

        const existingTrip = await ChuyenXe.findOne({ maChuyenXe: tripCode });
        if (!existingTrip) {
          const newTrip = {
            maChuyenXe: tripCode,
            maLichChay: masterSchedule.maLichChay,
            maLine: line.maLine,
            tuyenDuong: masterSchedule.tuyenDuong,
            ngayKhoiHanh: new Date(dateIterator),
            gioKhoiHanh: line.gioKhoiHanh, 
            loaiXe: line.loaiXe,
            loaiDichVu: line.loaiDichVu,
            trangThai: "CHUA_XUAT_BEN",
            ghiChu: line.ghiChu,
            laiXe: line.laiXe,
            phuXe: line.phuXe,
          };
         
          tripsToInsert.push(newTrip);
        }
      }
    }
    dateIterator.setDate(dateIterator.getDate() + 1);
  }

  if (tripsToInsert.length > 0) {
    try {
      const result = await ChuyenXe.insertMany(tripsToInsert, { ordered: false });
      console.log(`Đang tạo ${result.length} chuyến xe cho lịch trình ${masterSchedule.maLichChay} ...`);
      if (result.insertedCount < tripsToInsert.length) {
        console.warn(`${tripsToInsert.length - result.insertedCount} chuyến xe bị lỗi và không thể tạo.`);
      }
    } catch (err) {
      console.error("Lỗi khi chèn chuyến xe hàng loạt:", err.message);
    }
  }

  console.log(`Tạo thành công ${tripsToInsert.length} chuyến xe cho lịch trình ${masterSchedule.maLichChay}`);
};

export const createLichChayMoi = async (req, res) => {
  try {
    const processedBody = processLichChayBody(req.body);
    const newSchedule = new LichChayMaster(processedBody);
    const savedSchedule = await newSchedule.save();
    await createChuyenXeHangLoat(savedSchedule);

    res.status(201).json({
      message: "Tạo lịch chạy thành công và đã sinh chuyến xe.",
      data: savedSchedule,
    });
  } catch (err) {
    res.status(500).json({ sucess: false, message: err.message });
  }
};
export const updateLichChay = async (req, res) => {
    try {
        const { id } = req.params;

        const originalSchedule = await LichChayMaster.findById(id).lean();
        if (!originalSchedule) {
            return res.status(404).json({ message: "Không tìm thấy lịch chạy." });
        }

        // UPDATED: Xử lý chuyển đổi giờ trong request body trước khi cập nhật
        const processedBody = processLichChayBody(req.body);

        const updatedSchedule = await LichChayMaster.findByIdAndUpdate(
            id,
            processedBody,
            { new: true, runValidators: true }
        ).lean();
        
        const originalLinesMap = new Map(originalSchedule.lines.map(line => [line.maLine, line]));
        const linesToCreate = [];
        const linesToUpdate = [];

        for (const newLine of updatedSchedule.lines) {
            const originalLine = originalLinesMap.get(newLine.maLine);

            if (!originalLine) {
                linesToCreate.push(newLine);
            } else {
                 // So sánh các trường có thể thay đổi, bỏ qua gioKhoiHanh vì nó phức tạp hơn
                const isChanged = originalLine.loaiDichVu !== newLine.loaiDichVu || 
                                  originalLine.ghiChu !== newLine.ghiChu ||
                                  String(originalLine.laiXe) !== String(newLine.laiXe) ||
                                  String(originalLine.phuXe) !== String(newLine.phuXe);
                
                if (isChanged) {
                    linesToUpdate.push(newLine);
                }
            }
        }

        if (linesToCreate.length > 0) {
            // Truyền updatedSchedule đầy đủ để hàm có context (như tuyenDuong, ngayBatDau...)
            await createChuyenXeHangLoat(updatedSchedule, linesToCreate);
        }
        
        let totalModifiedTrips = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        for (const line of linesToUpdate) {
            const result = await ChuyenXe.updateMany(
                {
                    maLichChay: updatedSchedule.maLichChay,
                    maLine: line.maLine,
                    trangThai: { $in: ['CHUA_XUAT_BEN'] },
                    ngayKhoiHanh: { $gte: today }
                },
                {
                    $set: {
                        loaiDichVu: line.loaiDichVu,
                        ghiChu: `[Cập nhật Line] ${line.ghiChu || ''}`,
                        laiXe: line.laiXe, // Cập nhật cả lái xe và phụ xe
                        phuXe: line.phuXe
                    }
                }
            );
            totalModifiedTrips += result.modifiedCount;
        }

        res.status(200).json({
            message: `Cập nhật lịch chạy thành công. Đã sinh chuyến cho ${linesToCreate.length} Line mới và cập nhật ${totalModifiedTrips} chuyến xe hiện tại.`,
            data: updatedSchedule,
        });
    } catch (err) {
        console.error("Lỗi khi cập nhật lịch chạy:", err.message);
        res.status(500).json({ message: err.message });
    }
};
export const updateTrangThaiLichChay = async (req, res) => {
    const { id } = req.params;
    const trangThaiMoi = false; 
    const ghiChuHuy = 'Tự động hủy do Lịch chạy Master bị vô hiệu hóa.';

    try {
        const lichChay = await LichChayMaster.findByIdAndUpdate(
            id,
            { 
                trangThai: trangThaiMoi,
                $set: { 'lines.$[].active': false },
                thoiGianHuyChuyen : new Date()
            },
            { new: true } 
        );

        if (!lichChay) {
            return res.status(404).json({ message: 'Không tìm thấy lịch chạy.' });
        }
        const maLichChay = lichChay.maLichChay; 
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        const result = await ChuyenXe.updateMany(
            {
                maLichChay: maLichChay,
                ngayKhoiHanh: { $gte: today },
                trangThai: { $in: ['CHUA_XUAT_BEN'] } 
            },
            {
                $set: {
                    trangThai: 'HUY_CHUYEN',
                    ghiChu: ghiChuHuy,
                    thoiGianHuyChuyen : new Date()
                }
            }
        );

        const logMessage = `Đã vô hiệu hóa Lịch chạy ${maLichChay}, cập nhật ${lichChay.lines.length} Line con, và hủy ${result.modifiedCount} chuyến xe liên quan.`;
        console.log(logMessage);

        return res.status(200).json({
            message: logMessage,
            lichChay,
            modifiedTrips: result.modifiedCount
        });

    } catch (error) {
        console.error('Lỗi khi vô hiệu hóa lịch chạy Master:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ khi vô hiệu hóa lịch chạy Master.', error: error.message });
    }
};
export const getDanhSachLichChay = async (req, res) => {
  try {
    const schedules = await LichChayMaster.find().populate('tuyenDuong', '_id tenTuyen').populate('lines.loaiXe', '_id tenLoaiXe');;
    res.status(200).json({
      message: "Lấy danh sách lịch chạy thành công",
      success: true,
      data: schedules,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTrangThaiLine = async (req, res) => {
    const { activeStatus } = req.body; 
    const { lichChayId, maLine} = req.params; 

    try {
        const lichChay = await LichChayMaster.findById(lichChayId);

        if (!lichChay) {
            return res.status(404).json({ message: 'Lịch chạy không tồn tại.' });
        }
        const lineIndex = lichChay.lines.findIndex(line => line.maLine === maLine);

        if (lineIndex === -1) {
            return res.status(404).json({ message: 'Line chi tiết không tồn tại.' });
        }

        lichChay.lines[lineIndex].active = activeStatus;
        await lichChay.save();

        let logMessage = '';

        if (activeStatus === false) {
            const today = new Date();
             today.setHours(0, 0, 0, 0); 
            const result = await ChuyenXe.updateMany(
                {
                    maLichChay: lichChay.maLichChay, 
                    maLine: maLine,
                    trangThai: { $in: ['CHUA_XUAT_BEN'] }, 
                    ngayKhoiHanh: { $gte: today  }
                },
                {
                    $set: {
                        trangThai: 'HUY_CHUYEN',
                        ghiChu: 'Tự động hủy do Line lịch chạy bị vô hiệu hóa.',
                        thoiGianHuyChuyen : new Date()
                    }
                }
            );

            logMessage = `Đã vô hiệu hóa Line ${maLine} và hủy ${result.modifiedCount} chuyến xe liên quan.`;
            console.log(logMessage);

        } 
        else {
             logMessage = `Đã khôi phục Line ${maLine}. Hệ thống sẽ tiếp tục tạo chuyến mới dựa trên Line này.`;
             console.log(logMessage);
        }

        return res.status(200).json({
            message: logMessage,
            lichChay
        });

    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái line và chuyến xe:', error);
        return res.status(500).json({ message: 'Lỗi server khi xử lý yêu cầu.' });
    }
};

