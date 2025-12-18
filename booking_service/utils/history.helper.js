import LichSuVeXe from "../models/lichSuVeXe.model.js";

const fieldsToTrack = [
  "tenKhachHang", "soDienThoai", "diemDon", "diemTra", 
  "diemDonTC", "diemTraTC", "giaVeCoBan", "phuThu", 
  "giamGia", "hinhThucThanhToan", "trangThaiChiTiet",
  "ngayKhoiHanh", "chuyenXe", "maChoNgoi"
];

export const logFieldChanges = async ({
  ticketId,
  chiTietId,
  oldData = {},
  newData,
  action,
  nhanVien, 
  session = null
}) => {
  const changes = [];
  const initialState = {}; 

  fieldsToTrack.forEach(field => {
    let oldVal = oldData[field];
    let newVal = newData[field];

    if (field === "ngayKhoiHanh") {
      oldVal = oldVal ? new Date(oldVal).toISOString() : null;
      newVal = newVal ? new Date(newVal).toISOString() : null;
    }

    if (action === "CREATE") {
      initialState[field] = newData[field];
    } else {
      // Khi cập nhật, so sánh để tìm sự khác biệt
      // Sử dụng String() để xử lý cả trường hợp số và ObjectId
      if (String(oldVal || "") !== String(newVal || "")) {
        changes.push({
          field: field,
          old: oldData[field],
          new: newData[field]
        });
      }
    }
  });

  // Chỉ lưu nếu có thay đổi hoặc là hành động tạo mới
  if (changes.length > 0 || action === "CREATE") {
    const history = new LichSuVeXe({
      ticketId,
      chiTietVeId: chiTietId,
      action,
      nhanVienThucHien: nhanVien, 
      details: action === "CREATE" ? initialState : changes,
      thoiGian: new Date()
    });
    
    await history.save({ session });
  }
};