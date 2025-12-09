import axios from "axios";
import { TRIP_API_URL, PROMO_API_URL, BOOKING_API_URL, GIAVE_API_URL, TUYEN_DUONG_API_URL, API_GEMINI_URL } from "./config/env.js";
// const TRIP_API_URL = "http://localhost:3001/api/v1";
// const PROMO_API_URL = "http://localhost:3004/api/v1";
// const BOOKING_API_URL = "http://localhost:3005/api/v1";
// const API_GEMINI_KEY = "AIzaSyAaKOXhDKTGKFDH0GvfzEkwR5tabN7Vs14";
// const API_GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_GEMINI_KEY}`;
// const GIAVE_API_URL = "http://localhost:3001/api/v1/gia-ve/tim-gia-ve-ap-dung";
// const TUYEN_DUONG_API_URL = "http://localhost:3001/api/v1/tuyen-duong/lay-tuyen-duong";
const formatMinutesToHHMM = (totalMinutes) => {
  if (isNaN(totalMinutes)) return "00:00";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");
  return `${formattedHours}:${formattedMinutes}`;
};
const parseHHMMToMinutes = (timeString) => {
  if (!timeString || !timeString.includes(":")) return 0;
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
};



// --- Hàm callYourTripAPI (Đã cập nhật) ---
const callYourTripAPI = async (departure, destination, date) => {
  console.log(
    `\n--- [AI DEBUG] BẮT ĐẦU: callYourTripAPI ---
    Input: ${departure}, ${destination}, ${date}`
  );

  try {
    // ✅ THAY ĐỔI: Gọi thẳng API
    console.log(`[AI DEBUG] 1. Đang tìm ID cho điểm đi: "${departure}"`);
    const { data: resDi } = await axios.get(
      `${TRIP_API_URL}/dia-diem/tim-dia-diem-theo-ten`,
      { params: { ten: departure } }
    );

    if (!resDi || !resDi.success) {
      console.error("[AI DEBUG] 1. LỖI: Không tìm thấy điểm đi.", resDi);
      return {
        success: false,
        error: "LOCATION_NOT_FOUND",
        message: `Tôi không tìm thấy địa điểm đi: "${departure}".`,
      };
    }
    const diaDiemDi = resDi.data;
    console.log(`[AI DEBUG] 1. OK. ID Điểm đi: ${diaDiemDi._id}`);

    // ✅ THAY ĐỔI: Gọi thẳng API
    console.log(`[AI DEBUG] 2. Đang tìm ID cho điểm đến: "${destination}"`);
    const { data: resDen } = await axios.get(
      `${TRIP_API_URL}/dia-diem/tim-dia-diem-theo-ten`,
      { params: { ten: destination } }
    );

    if (!resDen || !resDen.success) {
      console.error("[AI DEBUG] 2. LỖI: Không tìm thấy điểm đến.", resDen);
      return {
        success: false,
        error: "LOCATION_NOT_FOUND",
        message: `Tôi không tìm thấy địa điểm đến: "${destination}".`,
      };
    }
    const diaDiemDen = resDen.data;
    console.log(`[AI DEBUG] 2. OK. ID Điểm đến: ${diaDiemDen._id}`);

    // ✅ THAY ĐỔI: Gọi thẳng API
    console.log(
      `[AI DEBUG] 3. Đang tìm chuyến xe với: Date=${date}, From=${diaDiemDi._id}, To=${diaDiemDen._id}`
    );
    const { data: tripResponse } = await axios.get(
      `${TRIP_API_URL}/chuyen-xe/theo-ngay-va-dia-diem`,
      {
        params: {
          ngayKhoiHanh: date,
          diemDiId: diaDiemDi._id,
          diemDenId: diaDiemDen._id,
        },
      }
    );

    console.log("[AI DEBUG] 3. OK. Kết quả API chuyến xe:", tripResponse);

    if (!tripResponse || !tripResponse.success) {
      console.error("[AI DEBUG] 3. LỖI: API tìm chuyến báo lỗi.", tripResponse);
      return tripResponse; // Trả về lỗi để AI biết
    }

    console.log("[AI DEBUG] KẾT THÚC: Thành công. Trả dữ liệu về cho AI.");
    return tripResponse;
  } catch (error) {
    console.error(
      "[AI DEBUG] LỖI NGHIÊM TRỌNG trong callYourTripAPI:",
      error.message
    );
    return {
      success: false,
      error: "API_ERROR",
      message: "Đã xảy ra lỗi hệ thống khi gọi API: " + error.message,
    };
  }
};

const callYourSeatAPI = async (tripId, numSeats) => {
  console.log(
    `[AI DEBUG] 2. Đang lấy GHẾ + ĐIỂM ĐÓN/TRẢ cho: ${tripId} (Số vé: ${numSeats})`
  );

  try {
    // ✅ THAY ĐỔI: Gọi thẳng API
    const tripDetailsPromise = axios.get(
      `${TRIP_API_URL}/chuyen-xe/by-obj-id/${tripId}`
    );

    let bookedSeats = [];
    try {
      console.log(
        `[AI DEBUG] 2.1. Đang lấy danh sách vé đã đặt cho: ${tripId}`
      );
      // ✅ THAY ĐỔI: Gọi thẳng API
      const { data: bookedTicketsResponse } = await axios.get(
        `${BOOKING_API_URL}/ve-xe/chuyen-xe/${tripId}`
      );

      if (bookedTicketsResponse.success && bookedTicketsResponse.data) {
        bookedSeats = bookedTicketsResponse.data.flatMap((ve) =>
          ve.chiTiet.map((detail) => detail.maChoNgoi)
        );
        console.log("[AI DEBUG] 2.1. OK. Các ghế đã đặt:", bookedSeats);
      } else {
        console.warn(
          "[AI DEBUG] 2.1. Không tìm thấy vé đã đặt (hoặc lỗi API vé)."
        );
      }
    } catch (ticketError) {
      console.warn(
        `[AI DEBUG] 2.1. LỖI (Không nghiêm trọng) khi lấy vé:`,
        ticketError.message
      );
    }

    // Chờ thông tin chuyến xe
    const { data: seatResponse } = await tripDetailsPromise;
    console.log("[AI DEBUG] 2.2. OK. Đã lấy chi tiết chuyến xe.");

    if (!seatResponse || !seatResponse.success) {
      console.error(
        "[AI DEBUG] LỖI: API chuyến xe báo success: false.",
        seatResponse
      );
      return {
        success: false,
        error: "TRIP_NOT_FOUND",
        message: "Lỗi: Không tìm thấy chuyến xe (API báo lỗi).",
      };
    }

    const trip = seatResponse.data;

    // KIỂM TRA QUAN TRỌNG NHẤT: Kiểm tra trip CÓ TỒN TẠI KHÔNG
    if (!trip) {
      console.error(
        "[AI DEBUG] LỖI NGHIÊM TRỌNG: API chuyến xe trả về data: null!"
      );
      return {
        success: false,
        error: "TRIP_DATA_NULL",
        message: "Lỗi: API chuyến xe trả về dữ liệu rỗng (data is null).",
      };
    }

    // Bây giờ mới kiểm tra an toàn trip.loaiXe
    if (!trip.loaiXe) {
      console.error("[AI DEBUG] LỖI NGHIÊM TRỌNG: trip.loaiXe bị null!", trip);
      return {
        success: false,
        error: "BUS_TYPE_MISSING",
        message: "Lỗi: Không thể lấy dữ liệu loại xe từ chuyến đi.",
      };
    }
    let tuyenDuongData = trip.tuyenDuong;

    if (tuyenDuongData && typeof tuyenDuongData === "string") {
      try {
        // (Hàm này vốn dĩ đã gọi thẳng, chỉ đổi sang URL chuẩn)
        const { data: tuyenDuongResponseData } = await axios.get(
          `${TUYEN_DUONG_API_URL}/${tuyenDuongData}`
        );
        if (tuyenDuongResponseData) {
          tuyenDuongData = tuyenDuongResponseData;
        } else {
          throw new Error("API tuyến đường trả về rỗng.");
        }
      } catch (tuyenDuongError) {
        // ✅ THÊM LOG VÀO ĐÂY ĐỂ XÁC NHẬN
        console.error(
          "[AI DEBUG] LỖI NGHIÊM TRỌNG: API Tuyến đường thất bại.",
          tuyenDuongError.message,
          "Chi tiết:",
          tuyenDuongError
        );

        return {
          success: false,
          message: "Lỗi: Không thể lấy chi tiết tuyến đường.",
        };
      }
    }
    const chiTietTuyen = tuyenDuongData?.chiTietTuyen;
    if (!chiTietTuyen || !Array.isArray(chiTietTuyen)) {
      return {
        success: false,
        error: "ROUTE_DETAILS_MISSING",
        message: "Lỗi: Không tìm thấy chi tiết tuyến đường (sau khi fetch).",
      };
    }

    // ================================================================
    // ✅ BẮT ĐẦU NÂNG CẤP SƠ ĐỒ GHẾ
    // ================================================================

    // 4. LẤY CẤU TRÚC SƠ ĐỒ GHẾ ĐẦY ĐỦ
    const soDoGhe = trip.loaiXe.soDoGhe; // Đây là mảng layout từ CSDL
    const loaiXeTen = trip.loaiXe.tenLoaiXe; // Vd: "Limousine 24 phòng"

    // Tạo sơ đồ ghế đầy đủ (fullSeatMap) cho FRONTEND
    // Mảng này sẽ chứa cả Lối đi (trangThai: false) và Ghế (trangThai: true)
    const fullSeatMap = soDoGhe.map((ghe) => ({
      // Các thuộc tính layout từ CSDL
      maSoGhe: ghe.maSoGhe, // vd: "A1" hoặc "LOIDI"
      tang: ghe.tang, // vd: "Tầng Dưới"
      hang: ghe.hang, // vd: 1
      cot: ghe.cot, // vd: 1
      trangThai: ghe.trangThai, // true = Ghế, false = Lối đi

      // Thuộc tính mới: Trạng thái đã đặt
      isBooked: bookedSeats.includes(ghe.maSoGhe), // true nếu đã bị đặt
    }));

    // 5. TẠO DANH SÁCH GHẾ TRỐNG (ĐƠN GIẢN) CHO AI (Gemini)
    // AI (Gemini) vẫn cần danh sách này để đọc cho người dùng
    const availableSeatsForAI = fullSeatMap
      .filter((ghe) => ghe.trangThai === true && ghe.isBooked === false)
      .map((ghe) => ghe.maSoGhe);

    // ================================================================
    // ✅ KẾT THÚC NÂNG CẤP SƠ ĐỒ GHẾ
    // ================================================================

    // 6. Xử lý Điểm đón (Giữ nguyên)
    const departureTimeInMinutes = trip.gioKhoiHanh || 0;
    const sortedPickupPoints = chiTietTuyen
      .filter((diem) => diem.loaiDiem === "don")
      .sort((a, b) => a.thuTu - b.thuTu);

    let cumulativePickupTime = 0;
    const formattedPickupPoints = sortedPickupPoints.map((item, index) => {
      if (index > 0) {
        cumulativePickupTime +=
          sortedPickupPoints[index - 1].thoiGianDuKien || 0;
      }
      return {
        id: item._id,
        time: formatMinutesToHHMM(
          departureTimeInMinutes + cumulativePickupTime
        ),
        name: item.diaDiem.tenDiaDiem,
      };
    });

    // 7. Xử lý Điểm trả (Giữ nguyên)
    const totalDuration = tuyenDuongData.thoiGian || 0;
    const arrivalTimeInMinutes = departureTimeInMinutes + totalDuration;

    const dropoffLocations = chiTietTuyen
      .filter((diem) => diem.loaiDiem === "tra")
      .sort((a, b) => a.thuTu - b.thuTu);

    let cumulativeDropoffTime = 0;
    const formattedDropoffPoints = dropoffLocations.map((item, index) => {
      if (index > 0) {
        cumulativeDropoffTime +=
          dropoffLocations[index - 1].thoiGianDuKien || 0;
      }
      return {
        id: item._id,
        time: formatMinutesToHHMM(arrivalTimeInMinutes + cumulativeDropoffTime),
        name: item.diaDiem.tenDiaDiem,
      };
    });

    let availablePromos = [];
    if (numSeats && numSeats > 0) {
      try {
        // ✅ THAY ĐỔI: Gọi thẳng API
        const { data: promoResponse } = await axios.get(
          `${PROMO_API_URL}/khuyen-mai/tim-ap-dung`,
          {
            params: {
              ngay: trip.ngayKhoiHanh,
              gio: trip.gioKhoiHanh,
              soLuongVeChay: numSeats,
            },
          }
        );

        if (promoResponse.success && promoResponse.data.length > 0) {
          promoResponse.data.forEach((campaign) => {
            campaign.lines.forEach((line) => {
              availablePromos.push({
                maLine: line.maLine,
                tenKhuyenMai: campaign.tenKhuyenMai,
                ghiChu: line.ghiChu || campaign.tenKhuyenMai,
              });
            });
          });
        }
      } catch (promoError) {
        // (Bỏ qua lỗi KM)
      }
    }

    console.log(
      "[AI DEBUG] 2. OK. Trả về Sơ đồ ghế (cho UI) và Ghế trống (cho AI)."
    );
    return {
      success: true,
      seatMap: { busType: loaiXeTen, layout: fullSeatMap },
      seats: { available: availableSeatsForAI, unavailable: bookedSeats },
      pickupPoints: formattedPickupPoints,
      dropoffPoints: formattedDropoffPoints,
      promotions: availablePromos,
    };
  } catch (error) {
    console.error(
      "[AI DEBUG] LỖI NGHIÊM TRỌNG trong callYourSeatAPI:",
      error.message
    );
    return {
      success: false,
      error: "API_ERROR",
      message: "Đã xảy ra lỗi hệ thống khi lấy sơ đồ ghế.",
    };
  }
};

// --- Hàm callYourBookingAPI (Đã cập nhật) ---
const callYourBookingAPI = async (
  tripId,
  seatIds,
  passengerInfo,
  pickupPointName,
  dropoffPointName,
  paymentMethod,
  promoCode,
  currentUserId
) => {
  console.log(
    `[AI DEBUG] 4. BẮT ĐẦU: callYourBookingAPI (Đặt vé thật)
    Chuyến: ${tripId},
    Ghế: ${seatIds.join(", ")},
    Khách: ${passengerInfo.name},
    Đón: ${pickupPointName},
    Trả: ${dropoffPointName},
    Thanh toán: ${paymentMethod},
    Mã KM: ${promoCode || "Không có"}
    User ID (Header): ${currentUserId || "N/A"}`
  );

  try {
    const { data: tripDetails } = await axios.get(
      `${TRIP_API_URL}/chuyen-xe/by-obj-id/${tripId}`
    );

    if (!tripDetails || !tripDetails.success) {
      return { success: false, message: "Lỗi: Không tìm thấy chuyến xe." };
    }
    const tripData = tripDetails.data;
    const chuyenXeId = tripData._id;

    // (Logic lấy giá vé - vốn dĩ đã gọi thẳng)
    let giaVeCoBan = 0;
    try {
      const priceParams = {
        tuyenDuongId: tripData.tuyenDuong, // Đây là ID tuyến đường (đã populate)
        loaiXeId: tripData.loaiXe._id,
        ngayHienTai: tripData.ngayKhoiHanh,
      };

      if (
        typeof tripData.tuyenDuong === "object" &&
        tripData.tuyenDuong !== null
      ) {
        priceParams.tuyenDuongId = tripData.tuyenDuong._id;
      }

      const priceResponse = await axios.get(GIAVE_API_URL, {
        params: priceParams,
      });

      if (priceResponse.data.success) {
        giaVeCoBan = priceResponse.data.soTienThanhToan;
      } else {
        throw new Error(priceResponse.data.message || "Không tìm thấy giá");
      }
    } catch (priceError) {
      console.error(
        "[AI DEBUG] 4.1. LỖI: Không lấy được giá vé:",
        priceError.message
      );
      return {
        success: false,
        message: `Lỗi: Không thể lấy được giá vé cho chuyến đi (${priceError.message})`,
      };
    }

    // TỔNG TIỀN TRƯỚC GIẢM
    const priceBeforeDiscount = giaVeCoBan * seatIds.length;
    let discountAmount = 0;
    let selectedPromoLine = null; // Dùng để lưu campaignId

    // BƯỚC 3: XỬ LÝ KHUYẾN MÃI (NẾU CÓ)
    if (promoCode) {
      console.log(`[AI DEBUG] 4.2. Đang kiểm tra Mã KM: ${promoCode}`);
      try {
        const promoResponse = await api_promotion_service.timKhuyenMaiApDung(
          tripData.ngayKhoiHanh,
          tripData.gioKhoiHanh,
          seatIds.length
        );

        if (promoResponse.success && promoResponse.data.length > 0) {
          // Tìm line khuyến mãi khớp với mã
          for (const campaign of promoResponse.data) {
            const line = campaign.lines.find(
              (l) => l.maLine.toLowerCase() === promoCode.toLowerCase()
            );
            if (line) {
              selectedPromoLine = {
                ...line,
                campaignId: campaign._id,
              };
              break;
            }
          }
        }

        if (!selectedPromoLine) {
          console.error(
            `[AI DEBUG] 4.2. LỖI: Mã KM "${promoCode}" không hợp lệ.`
          );
          return {
            success: false,
            message: `Mã khuyến mãi "${promoCode}" không hợp lệ hoặc không áp dụng được cho chuyến này.`,
          };
        }

        // TÍNH TOÁN GIẢM GIÁ (Logic từ PaymentScreen.tsx)
        const { loaiKhuyenMai, chiTiet } = selectedPromoLine;
        if (loaiKhuyenMai === "GIAM_PHAN_TRAM") {
          discountAmount = priceBeforeDiscount * (chiTiet.phanTramGiam / 100);
          if (
            chiTiet.soTienGiamToiDa &&
            discountAmount > chiTiet.soTienGiamToiDa
          )
            discountAmount = chiTiet.soTienGiamToiDa;
        } else if (loaiKhuyenMai === "GIAM_TIEN") {
          discountAmount = chiTiet.soTienGiam;
        } else if (loaiKhuyenMai === "TANG_VE" && seatIds.length > 0) {
          discountAmount = giaVeCoBan * (chiTiet.soLuongVeTang || 1);
        }

        console.log(
          `[AI DEBUG] 4.2. OK. Áp dụng KM thành công. Giảm: ${discountAmount}`
        );
      } catch (promoError) {
        console.error(
          "[AI DEBUG] 4.2. LỖI: API khuyến mãi:",
          promoError.message
        );
        return { success: false, message: "Lỗi khi kiểm tra khuyến mãi." };
      }
    }

    // TỔNG TIỀN SAU GIẢM
    const finalPrice = priceBeforeDiscount - discountAmount;

    // BƯỚC 4: PHÂN BỔ TIỀN GIẢM VÀ CHUẨN BỊ PAYLOAD VÉ
    const numTickets = seatIds.length;
    let discountDistributed = 0;
    const discountPerTicket =
      Math.round((discountAmount / numTickets) * 1000) / 1000;

    const chiTietVe = seatIds.map((seatMa, index) => {
      let ticketDiscount = 0;
      if (index < numTickets - 1) {
        ticketDiscount = discountPerTicket;
        discountDistributed += ticketDiscount;
      } else {
        ticketDiscount = discountAmount - discountDistributed;
        ticketDiscount = Math.round(ticketDiscount * 1000) / 1000;
      }

      return {
        chuyenXe: chuyenXeId,
        tenKhachHang: passengerInfo.name,
        soDienThoai: passengerInfo.phone,
        email: passengerInfo.email || "",
        maChoNgoi: seatMa,
        diemDon: pickupPointName,
        diemTra: dropoffPointName,
        giaVeCoBan: giaVeCoBan,
        phuThu: 0,
        giamGia: ticketDiscount, // <-- Gán tiền giảm đã chia
        trangThaiChiTiet:
          paymentMethod === "TAI_XE" ? "DAT_CHO" : "DA_THANH_TOAN",
        vnpTransactionNo: null,
      };
    });

    const ticketPayload = {
      chiTiet: chiTietVe,
      maGiamGia: selectedPromoLine ? selectedPromoLine.campaignId : null,
      hinhThucThanhToan: null,
      nhanVienTao: "690471e2292bcd0f56f104e8",
      userId: currentUserId || null,
    };

    const { data: response } = await axios.post(
      `${BOOKING_API_URL}/ve-xe`,
      ticketPayload
    );

    if (response.success) {
      console.log("[AI DEBUG] 4.3. OK. Đặt vé thành công.");
      return {
        ...response,
        finalPrice: finalPrice,
        discountAmount: discountAmount,
      };
    } else {
      console.error("[AI DEBUG] 4.3. LỖI: Đặt vé thất bại.", response);
      return response;
    }
  } catch (error) {
    console.error(
      "[AI DEBUG] LỖI NGHIÊM TRỌNG trong callYourBookingAPI:",
      error.message
    );
    return {
      success: false,
      error: "API_ERROR",
      message: "Đã xảy ra lỗi hệ thống khi gọi API đặt vé.",
    };
  }
};

// --- Hàm callYourPriceCalculationAPI (Đã cập nhật) ---
const callYourPriceCalculationAPI = async (tripId, seatIds, promoCode) => {
  console.log(
    `[AI DEBUG] 3. BẮT ĐẦU: callYourPriceCalculationAPI (Kiểm tra giá)
    Chuyến: ${tripId},
    Ghế: ${seatIds.join(", ")},
    Mã KM: ${promoCode || "Không có"}`
  );

  try {
    // ✅ THAY ĐỔI: Gọi thẳng API
    const { data: tripDetails } = await axios.get(
      `${TRIP_API_URL}/chuyen-xe/by-obj-id/${tripId}`
    );
    if (!tripDetails || !tripDetails.success) {
      return { success: false, message: "Lỗi: Không tìm thấy chuyến xe." };
    }
    const tripData = tripDetails.data;

    // (Logic lấy giá vé - vốn dĩ đã gọi thẳng)
    let giaVeCoBan = 0;
    try {
      const priceParams = {
        tuyenDuongId: tripData.tuyenDuong,
        loaiXeId: tripData.loaiXe._id,
        ngayHienTai: tripData.ngayKhoiHanh,
      };
      if (
        typeof priceParams.tuyenDuongId === "object" &&
        priceParams.tuyenDuongId !== null
      ) {
        priceParams.tuyenDuongId = priceParams.tuyenDuongId._id;
      }
      const priceResponse = await axios.get(GIAVE_API_URL, {
        params: priceParams,
      });
      if (priceResponse.data.success) {
        giaVeCoBan = priceResponse.data.soTienThanhToan;
      } else {
        throw new Error(priceResponse.data.message || "Không tìm thấy giá");
      }
    } catch (priceError) {
      console.error(
        "[AI DEBUG] 3.1. LỖI: Không lấy được giá vé:",
        priceError.message
      );
      return {
        success: false,
        message: `Lỗi: Không thể lấy được giá vé cho chuyến đi (${priceError.message})`,
      };
    }

    // TỔNG TIỀN TRƯỚC GIẢM
    const priceBeforeDiscount = giaVeCoBan * seatIds.length;
    let discountAmount = 0;
    let selectedPromoLine = null;

    // BƯỚC 3: XỬ LÝ KHUYẾN MÃI (NẾU CÓ)
    if (promoCode) {
      console.log(`[AI DEBUG] 3.2. Đang kiểm tra Mã KM: ${promoCode}`);
      try {
        const { data: promoResponse } = await axios.get(
          `${PROMO_API_URL}/khuyen-mai/tim-ap-dung`,
          {
            params: {
              ngay: tripData.ngayKhoiHanh,
              gio: tripData.gioKhoiHanh,
              soLuongVeChay: seatIds.length,
            },
          }
        );
        if (promoResponse.success && promoResponse.data.length > 0) {
          for (const campaign of promoResponse.data) {
            const line = campaign.lines.find(
              (l) => l.maLine.toLowerCase() === promoCode.toLowerCase()
            );
            if (line) {
              selectedPromoLine = { ...line, campaignId: campaign._id };
              break;
            }
          }
        }

        if (!selectedPromoLine) {
          console.error(
            `[AI DEBUG] 3.2. LỖI: Mã KM "${promoCode}" không hợp lệ.`
          );
          return {
            success: false,
            message: `Mã khuyến mãi "${promoCode}" không hợp lệ hoặc không áp dụng được cho chuyến này.`,
          };
        }

        const { loaiKhuyenMai, chiTiet } = selectedPromoLine;
        if (loaiKhuyenMai === "GIAM_PHAN_TRAM") {
          discountAmount = priceBeforeDiscount * (chiTiet.phanTramGiam / 100);
          if (
            chiTiet.soTienGiamToiDa &&
            discountAmount > chiTiet.soTienGiamToiDa
          )
            discountAmount = chiTiet.soTienGiamToiDa;
        } else if (loaiKhuyenMai === "GIAM_TIEN") {
          discountAmount = chiTiet.soTienGiam;
        } else if (loaiKhuyenMai === "TANG_VE" && seatIds.length > 0) {
          discountAmount = giaVeCoBan * (chiTiet.soLuongVeTang || 1);
        }

        console.log(
          `[AI DEBUG] 3.2. OK. Áp dụng KM thành công. Giảm: ${discountAmount}`
        );
      } catch (promoError) {
        console.error(
          "[AI DEBUG] 3.2. LỖI: API khuyến mãi:",
          promoError.message
        );
        return { success: false, message: "Lỗi khi kiểm tra khuyến mãi." };
      }
    }

    // TỔNG TIỀN SAU GIẢM
    const finalPrice = priceBeforeDiscount - discountAmount;

    // BƯỚC 4: TRẢ VỀ KẾT QUẢ TÍNH TOÁN
    // (Không đặt vé, chỉ trả về giá)
    console.log("[AI DEBUG] 3.3. OK. Trả về kết quả tính giá.");
    return {
      success: true,
      priceBeforeDiscount: priceBeforeDiscount, // Giá gốc
      discountAmount: discountAmount, // Số tiền giảm
      finalPrice: finalPrice, // Giá cuối
    };
  } catch (error) {
    console.error(
      "[AI DEBUG] LỖI NGHIÊM TRỌNG trong callYourPriceCalculationAPI:",
      error.message
    );
    return {
      success: false,
      error: "API_ERROR",
      message: "Đã xảy ra lỗi hệ thống khi gọi API tính giá.",
    };
  }
};



const systemPrompt = `
  Bạn là trợ lý AI chính thức của Nhà xe Việt Tân Phát.
  Nhiệm vụ của bạn là giúp hành khách tìm kiếm chuyến xe,
  kiểm tra ghế trống, và đặt vé CHỈ cho Nhà xe Việt Tân Phát.
  
  - Luôn sử dụng tên "Nhà xe Việt Tân Phát" khi giới thiệu hoặc xác nhận.
  - Bạn không cần hỏi người dùng muốn đi nhà xe nào.
  - Ngày hôm nay là: ${new Date().toLocaleDateString("vi-VN")}
  - KHÔNG BAO GIỜ được trả lời bằng các câu xác nhận trung gian như "Tuyệt vời, tôi sẽ kiểm tra...",
    hoặc "OK, tôi sẽ tìm...". Bạn phải gọi tool (functionCall) ngay lập tức.
  
  --- BỔ SUNG QUAN TRỌNG: GHI NHỚ NGỮ CẢNH ĐẶT VÉ ---

  Bạn phải luôn theo dõi và ghi nhớ các thông tin mà khách đã nói trong lịch sử chat.
  Không bao giờ được yêu cầu lại các thông tin đã được cung cấp.

  BẠN PHẢI TỰ ĐỘNG SUY LUẬN NGỮ CẢNH:
  - Nếu khách đã chọn chuyến → không hỏi lại chuyến.
  - Nếu khách đã nói số người → tự hiểu numSeats.
  - Nếu khách đã chọn ghế → lưu ghế vào bộ nhớ tạm.
  - Nếu khách đang chọn điểm đón → hiểu rằng bước tiếp theo là điểm trả.
  - Nếu khách đã đưa tên + SĐT → hiểu rằng bước tiếp theo là tính giá.
  - Nếu khách nói "đổi ghế", "đi 3 người thay vì 2" → cập nhật lại mọi bước liên quan (ghế, KM…).

  BẠN PHẢI TỰ ĐỘNG ĐIỀN THIẾU:
  Ví dụ:
  - Khách chỉ nói "đi 2 người" ⇒ bạn tự hiểu dựa vào chuyến đang mở.
  - Khách chỉ nói "lấy ghế A2 A3" ⇒ bạn phải biết đang nói tới chuyến nào.
  - Khách nói "tôi tên Tùng, số tôi 0909…" ⇒ bạn phải biết đây là bước thông tin khách hàng.

  BẠN PHẢI PHẢN HỒI MỘT CÁCH TỰ NHIÊN, KHÔNG MÁY MÓC:
  - Hiểu từ đồng nghĩa: “lấy”, “chọn”, “giữ”, “đặt”
  - Hiểu ngữ cảnh: “tới đoạn nào rồi?” ⇒ bạn phải biết khách đang ở bước nào.
  - Hiểu sửa lỗi: “cho tôi đổi sang ghế A4” ⇒ bạn cập nhật lại ghế và hỏi bước tiếp theo.
  - Hiểu yêu cầu tắt bớt bước: “khỏi điểm trả nhé, trả giống bạn hôm qua” ⇒ bạn tự dùng dữ liệu đã nhớ.

  BẠN PHẢI CẦM TAY CHỈ VIỆC:
  - Luôn biết bước hiện tại trong quy trình đặt vé.
  - Luôn dẫn dắt khách tới bước tiếp theo.
  - Tuyệt đối không lan man hay xin "xác nhận" trước khi tới bước review cuối.

  BẠN PHẢI PHẢN HỒI MỘT CÁCH TỰ NHIÊN, KHÔNG MÁY MÓC:
  - Hiểu từ đồng nghĩa: “lấy”, “chọn”, “giữ”, “đặt”
  - Hiểu ngữ cảnh: “tới đoạn nào rồi?” ⇒ bạn phải biết khách đang ở bước nào.
  - Hiểu sửa lỗi: “cho tôi đổi sang ghế A4” ⇒ bạn cập nhật lại ghế và hỏi bước tiếp theo.
  - Hiểu yêu cầu tắt bớt bước: “khỏi điểm trả nhé, trả giống bạn hôm qua” ⇒ bạn tự dùng dữ liệu đã nhớ.

  // --- [PHẦN THÊM MỚI BẮT ĐẦU TỪ ĐÂY] ---

  --- XỬ LÝ NGHIỆP VỤ VÀ LỖI CHÍNH TẢ (RẤT QUAN TRỌNG) ---

  Bạn phải là một trợ lý thông minh, không phải một con robot máy móc.
  
  **1. Xử lý lỗi chính tả và nhập liệu không rõ ràng:**
  
  * **Địa điểm:** Nếu khách nhập 'Bến xê Mền Đông' và tool \`find_trips\` trả về lỗi \`LOCATION_NOT_FOUND\` (với message: 'Tôi không tìm thấy địa điểm...'), bạn không được chỉ lặp lại lỗi. 
      Bạn phải nói: "Tôi không tìm thấy 'Bến xê Mền Đông'. Bạn có thể vui lòng **kiểm tra lại chính tả**, hoặc cung cấp tên bến xe/văn phòng cụ thể hơn không?"
  
  * **Mã khuyến mãi:** Nếu tool \`calculate_final_price\` báo lỗi mã không hợp lệ (ví dụ: khách nhập 'SALE5O' thay vì 'SALE50'), bạn phải gợi ý khách kiểm tra lại.
      Ví dụ: "Mã 'SALE5O' có vẻ không hợp lệ. Bạn có muốn kiểm tra lại xem có nhầm lẫn (ví dụ: giữa chữ O và số 0) không?"
  
  * **Tên hành khách:** Chấp nhận tên như khách hàng cung cấp, kể cả khi có vẻ sai chính tả (Ví dụ: 'Nguyễn Vă A'). **Không được tự ý sửa tên** của khách.

  **2. Xử lý các nghiệp vụ (Business Logic) đặc thù:**

  * **Giá vé trẻ em / Em bé:** Nếu khách hỏi "tôi đi cùng bé 2 tuổi", "trẻ em có miễn vé không?", bạn phải giải thích rõ ràng chính sách của nhà xe.
      Ví dụ: "Dạ, theo quy định của Nhà xe Việt Tân Phát, mỗi hành khách (bất kể độ tuổi) chiếm một ghế/giường đều phải mua một vé với giá như nhau. Nếu bạn đi 2 người lớn và 1 em bé (tổng cộng 3 người), tôi sẽ tìm chuyến và tính 3 vé nhé."
  
  * **Yêu cầu loại ghế (tầng trên/dưới, cửa sổ):** Tool \`get_available_seats\` chỉ trả về danh sách mã ghế trống (ví dụ: 'A1', 'A20'), **không** trả về chi tiết vị trí (tầng 1, tầng 2, hay cửa sổ).
      Nếu khách yêu cầu 'cho tôi ghế tầng dưới', bạn phải trả lời: 
      "Dạ, hiện tại hệ thống chỉ hiển thị các mã ghế còn trống là: [A1, A2, A20...]. Hệ thống không cung cấp thông tin chi tiết vị trí (như tầng trên/dưới hay gần cửa sổ). Mong bạn thông cảm. Bạn có muốn chọn một trong các ghế trống này không?"
  
  * **Các câu hỏi ngoài luồng (Hủy vé, Hành lý):** Nếu khách hỏi các câu không liên quan trực tiếp đến luồng đặt vé (ví dụ: 'chính sách hủy vé thế nào?', 'tôi được mang bao nhiêu kg hành lý?'), bạn phải trả lời một cách tổng quát và lái về luồng đặt vé.
      Ví dụ: "Về chính sách hủy vé hoặc hành lý, bạn vui lòng liên hệ tổng đài 1900 xxxx để được hỗ trợ chi tiết nhất. Còn bây giờ, chúng ta tiếp tục đặt vé nhé?"


  --- QUAN TRỌNG: HƯỚNG DẪN XỬ LÝ DỮ LIỆU API ---
  
  **1. Khi bạn gọi tool \`find_trips\` (TÌM CHUYẾN):**
     - Dữ liệu chuyến xe nằm trong mảng \`functionResult.data\`.
     - Nếu \`data\` rỗng, báo không tìm thấy chuyến.
     - Với MỖI CHUYẾN XE, hãy đọc: \`id\` (đây là ID thật), \`departureTime\`, \`arrivalTime\`, \`price\`, \`seatsLeft\`, \`busType\`.
     - ===> BẠN PHẢI GHI NHỚ \`id\` (Rất quan trọng) <===
     - ===> BẠN KHÔNG ĐƯỢC HIỂN THỊ \`id\` CHO KHÁCH HÀNG <===
     
     - **Cách trả lời mẫu (KHÔNG HIỂN THỊ MÃ):**
       "Tôi tìm thấy 2 chuyến đi phù hợp:
       1. Chuyến 19:30 (Loại xe: Limousine 24 phòng đôi), đến lúc 23:55, giá 500.000 ₫. **Còn [seatsLeft].**
       2. Chuyến 22:00 (Loại xe: Limousine 34 phòng đơn), đến lúc 02:25, giá 350.000 ₫. **Còn [seatsLeft].**
       
       Bạn muốn chọn chuyến nào (ví dụ: 'chuyến 19:30') và **dự định đi mấy người** để tôi kiểm tra ghế và khuyến mãi không?"
     - **Nếu người dùng trả lời (ví dụ: 'chuyến 19:30, 2 người'):** BẠN PHẢI GỌI TOOL \`get_available_seats(tripId, numSeats)\` NGAY LẬP TỨC (với tripId là \`id\` bạn đã nhớ).

  **2. Khi bạn gọi tool \`get_available_seats\` (LẤY GHẾ):**
     - Bạn phải gửi \`id\` (mà bạn đã nhớ ở bước 1) làm tham số \`tripId\`.
     - Bạn sẽ nhận lại một object chứa: \`seats\`, \`pickupPoints\`, \`dropoffPoints\`, \`promotions\`.
     
     **QUY TRÌNH HỎI KHÁCH (BẮT BUỘC THEO THỨ TỰ):**
     
     - **BƯỚC 2.1 (TRẢ LỜI ĐẦU TIÊN - HỎI GHẾ & BÁO KM):**
       - **ĐỌC DỮ LIỆU GHẾ:** Bạn sẽ nhận được \`functionResult.seats\` có dạng \`{ available: ["A1", "B2"], unavailable: ["A3"] }\`.
       - BẠN PHẢI duyệt mảng \`functionResult.seats.available\` và liệt kê các ghế đó.
       
       - **Cách hỏi mẫu (Có KM):** "Chuyến này còn các ghế trống sau: [danh sách ghế từ seats.available]. 
           Tuyệt vời! Vì bạn đi [X] người, Nhà xe An Vui đang có các khuyến mãi sau:
           1. Mã \`[maLine]\`: [ghiChu]
           2. Mã \`[maLine]\`: [ghiChu]
           (Bạn có thể chọn mã ở bước sau).
           Bây giờ, bạn muốn chọn ghế nào? (Ví dụ: 'A1, B1')"
       - **Cách hỏi mẫu (Không KM):** "Chuyến này còn các ghế trống sau: [danh sách ghế từ seats.available]. Bạn muốn chọn ghế nào? (Bạn có thể chọn một hoặc nhiều ghế)"
       - **Cách hỏi mẫu (Hết ghế):** "Rất tiếc, chuyến xe này đã hết ghế trống (mảng seats.available bị rỗng). Bạn có muốn chọn chuyến khác không?"
     
     - **BƯỚC 2.2 (KHÁCH TRẢ LỜI - HỎI ĐIỂM ĐÓN):**
       - (Giữ nguyên)
       - **Cách hỏi mẫu:** "OK, tôi giữ ghế [ghế khách chọn]. Bạn muốn đón tại điểm nào sau đây?
         1. [07:00] Bến xe An Sương
         2. [07:15] Ngã 4 Ga
         (Vui lòng chọn 1 điểm đón)"

     - **BƯỚC 2.3 (KHÁCH TRẢ LỜI - HỎI ĐIỂM TRẢ):**
       - (Giữ nguyên)
       - **Cách hỏi mẫu:** "OK, bạn sẽ lên xe tại [điểm đón khách chọn]. Bạn muốn trả tại điểm nào sau đây?
         1. [14:00] Bến xe Ninh Sơn
         2. [14:15] Chợ Ninh Sơn
         (Vui lòng chọn 1 điểm trả)"

     - **BƯỚC 2.4 (KHÁCH TRẢ LỜI - HỎI THÔNG TIN):**
       - SAU KHI khách chọn điểm trả, bạn hỏi thông tin cuối cùng.
       - **Cách hỏi mẫu (Nếu trước đó CÓ KM):** "Tuyệt vời! Vui lòng cho tôi biết **Tên** và **Số điện thoại** của bạn. Bạn có muốn dùng một trong các mã khuyến mãi tôi đã nêu (ví dụ: 'SALE50') không? (Nếu không dùng, bạn có thể bỏ qua)"
       - **Cách hỏi mẫu (Nếu trước đó KHÔNG CÓ KM):** "Tuyệt vời! Vui lòng cho tôi biết **Tên** và **Số điện thoại** của bạn. (Email là tùy chọn). Nếu bạn có mã khuyến mãi khác, vui lòng cung cấp."

     - **(SỬA ĐỔI QUAN TRỌNG):**
       - **Nếu người dùng trả lời (ví dụ: 'Nguyễn Văn A, 0909...'):** - BẠN KHÔNG ĐƯỢC GỌI \`book_ticket\` NGAY.
       - BẠN PHẢI GỌI TOOL \`calculate_final_price\` NGAY LẬP TỨC.
       - Khi gọi \`calculate_final_price\`, bạn phải gửi TẤT CẢ thông tin cần thiết: (tripId, seatIds, promoCode).
  
  **3. Khi bạn gọi tool \`calculate_final_price\` (BƯỚC XÁC NHẬN MỚI):**
     - Tool này sẽ trả về \`functionResult\` chứa: \`priceBeforeDiscount\`, \`discountAmount\`, \`finalPrice\`.
     - Nếu \`success: false\`, bạn phải báo lỗi cho người dùng (ví dụ: "Lỗi: Mã khuyến mãi không hợp lệ.").
     - Nếu \`success: true\`, nhiệm vụ của bạn là trình bày TOÀN BỘ thông tin (lấy từ các bước trước) VÀ KẾT QUẢ GIÁ (từ \`functionResult\`) để người dùng xem lại.

     - **Cách trả lời mẫu (KHÔNG giảm giá - khi \`discountAmount\` = 0):**
       "Cảm ơn bạn. Vui lòng kiểm tra lại thông tin đặt vé lần cuối:
       * Hành khách: [Tên] - [SĐT]
       * Chuyến: [Giờ khởi hành]
       * Ghế: [A1, B1]
       * Đón tại: [Tên điểm đón]
       * Trả tại: [Tên điểm trả]
       * Tổng tiền: [finalPrice] ₫ (Thanh toán khi lên xe)
       
       Bạn có xác nhận đặt vé với thông tin này không? (Vui lòng trả lời 'Xác nhận' hoặc 'Hủy')"

     - **Cách trả lời mẫu (CÓ giảm giá - khi \`discountAmount\` > 0):**
       "Cảm ơn bạn. Vui lòng kiểm tra lại thông tin đặt vé lần cuối:
       * Hành khách: [Tên] - [SĐT]
       * Chuyến: [Giờ khởi hành]
       * Ghế: [A1, B1]
       * Đón tại: [Tên điểm đón]
       * Trả tại: [Tên điểm trả]
       * Mã khuyến mãi: [promoCode]
       * Giá gốc: [priceBeforeDiscount] ₫
       * Giảm giá: -[discountAmount] ₫
       * **Tổng cuối cùng: [finalPrice] ₫** (Thanh toán khi lên xe)
       
       Bạn có xác nhận đặt vé với thông tin này không? (Vui lòng trả lời 'Xác nhận' hoặc 'Hủy')"

     - **Nếu người dùng trả lời 'Xác nhận':** BẠN MỚI ĐƯỢC GỌI TOOL \`book_ticket\` (với các thông tin bạn đã thu thập).
     - **Nếu người dùng trả lời 'Hủy' hoặc muốn 'Sửa lại':** Bạn phải hỏi lại họ muốn sửa thông tin gì (ví dụ: "Bạn muốn thay đổi thông tin gì? (ghế, điểm đón, SĐT...)"
  
  **4. Khi bạn gọi tool \`book_ticket\` (ĐẶT VÉ):**
     - Bạn phải gửi \`id\` (mà bạn đã nhớ) làm tham số \`tripId\`.
     - **Cách trả lời mẫu (Thành công KHÔNG giảm giá):**
       "Cảm ơn bạn! Tôi đã đặt vé thành công (thanh toán khi lên xe). Tổng tiền của bạn là [finalPrice] ₫. Chúc bạn có một chuyến đi vui vẻ với Nhà xe An Vui."
     - **Cách trả lời mẫu (Thành công CÓ giảm giá):**
       "Cảm ơn bạn! Mã khuyến mãi đã được áp dụng, bạn được giảm [discountAmount] ₫.
       Tôi đã đặt vé thành công (thanh toán khi lên xe). Tổng tiền cuối cùng của bạn là [finalPrice] ₫. Chúc bạn có một chuyến đi vui vẻ với Nhà xe An Vui."
       
     - **Cách trả lời mẫu (Lỗi khuyến mãi):**
       "Xin lỗi, tôi không thể đặt vé: [nội dung message lỗi, ví dụ: 'Mã khuyến mãi không hợp lệ.']. Bạn có muốn đặt vé mà không dùng mã này không?"

  **5. CÁCH XỬ LÝ KHI TOOL THẤT BẠI (Rất quan trọng):**
     - (Giữ nguyên)
`;

// ✅ SỬA 3: `tools` (Cập nhật mô tả tripId)
const tools = [
  {
    functionDeclarations: [
      // Tool 1: find_trips (Giữ nguyên)
      {
        name: "find_trips",
        description:
          "Tìm kiếm các chuyến xe dựa trên điểm đi, điểm đến và ngày đi.",
        parameters: {
          type: "OBJECT",
          properties: {
            departure: {
              type: "STRING",
              description: 'Địa điểm xuất phát, ví dụ: "Hà Nội"',
            },
            destination: {
              type: "STRING",
              description: 'Địa điểm đến, ví dụ: "Đà Nẵng"',
            },
            date: {
              type: "STRING",
              description:
                'Ngày đi, theo định dạng YYYY-MM-DD. Nếu người dùng nói "ngày mai", hãy tự tính ngày.',
            },
          },
          required: ["departure", "destination", "date"],
        },
      },
      // Tool 2: get_available_seats (NÂNG CẤP)
      {
        name: "get_available_seats",
        description:
          "Lấy danh sách ghế trống, ĐIỂM ĐÓN, ĐIỂM TRẢ và CÁC KHUYẾN MÃI HỢP LỆ cho một chuyến xe cụ thể.",
        parameters: {
          type: "OBJECT",
          properties: {
            tripId: {
              type: "STRING",
              // --- SỬA Ở ĐÂY ---
              description: "ID (ObjectId) của chuyến xe (ví dụ: '6908ba...')",
            },
            numSeats: {
              type: "NUMBER",
              description:
                "Số lượng vé khách dự định mua (ví dụ: 2). Rất quan trọng để kiểm tra khuyến mãi. Nếu không rõ, gửi null.",
            },
          },
          required: ["tripId"],
        },
      },
      {
        name: "calculate_final_price",
        description:
          "QUAN TRỌNG: Gọi tool này SAU KHI đã thu thập TẤT CẢ thông tin (ghế, tên, SĐT, mã KM) " +
          "VÀ TRƯỚC KHI gọi 'book_ticket'. " +
          "Tool này sẽ tính toán và trả về giá gốc, số tiền giảm, và giá cuối cùng.",
        parameters: {
          type: "OBJECT",
          properties: {
            tripId: {
              type: "STRING",
              description: "ID (ObjectId) của chuyến xe (ví dụ: '6908ba...')",
            },
            seatIds: {
              type: "ARRAY",
              description: "Mảng các mã ghế khách chọn (ví dụ: ['A1', 'B2'])",
              items: { type: "STRING" },
            },
            promoCode: {
              type: "STRING",
              description:
                "Mã khuyến mãi khách hàng cung cấp (ví dụ: 'GIGA50'). Gửi null nếu không có.",
            },
          },
          required: ["tripId", "seatIds"],
        },
      },
      // Tool 3: book_ticket (NÂNG CẤP)
      {
        name: "book_ticket",
        description: "Chốt và đặt vé cho khách hàng.",
        parameters: {
          type: "OBJECT",
          properties: {
            tripId: {
              type: "STRING",
              description: "ID (ObjectId) của chuyến xe (ví dụ: '6908ba...')",
            },
            seatIds: {
              type: "ARRAY",
              description:
                "MỘT MẢNG các mã ghế khách chọn (ví dụ: ['A1', 'B2'])",
              items: { type: "STRING" },
            },
            passengerInfo: {
              type: "OBJECT",
              description: "Thông tin hành khách",
              properties: {
                name: { type: "STRING", description: "Họ và tên" },
                phone: { type: "STRING", description: "Số điện thoại" },
                email: {
                  type: "STRING",
                  description: "Email của khách (TÙY CHỌN, có thể là null)",
                },
              },
              required: ["name", "phone"], // Email không bắt buộc
            },
            pickupPointName: {
              type: "STRING",
              description:
                "Tên điểm đón mà khách đã chọn (ví dụ: 'Bến xe An Sương')",
            },
            dropoffPointName: {
              type: "STRING",
              description:
                "Tên điểm trả mà khách đã chọn (ví dụ: 'Bến xe Ninh Sơn')",
            },
            paymentMethod: {
              type: "STRING",
              description: "Phương thức thanh toán. Chỉ chấp nhận 'TAI_XE'.",
              enum: ["TAI_XE"],
            },
            promoCode: {
              type: "STRING",
              description:
                "Mã khuyến mãi khách hàng cung cấp (ví dụ: 'GIGA50'). Gửi null nếu không có.",
            },
          },
          required: [
            "tripId",
            "seatIds",
            "passengerInfo",
            "pickupPointName",
            "dropoffPointName",
            "paymentMethod",
          ],
        },
      },
    ],
  },
];

async function processMessage(userInput, chatHistory, userId) {
  chatHistory.push({ role: "user", parts: [{ text: userInput }] });

  try {
    const result = await run(chatHistory, userId);
    return result;
  } catch (error) {
    console.error("Lỗi nghiêm trọng trong processMessage:", error);
    chatHistory.pop();
    return {
      reply: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại. " + error.message,
      newHistory: chatHistory,
    };
  }
}

async function run(history, userId) {
  const payload = {
    contents: history,
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    tools: tools,
  };

  const response = await axios.post(API_GEMINI_URL, payload, {
    headers: { "Content-Type": "application/json" },
  });

  if (response.status !== 200) {
    const errorBody = JSON.stringify(response.data);
    console.error("Lỗi API Gemini:", response.status, errorBody);
    throw new Error(
      `API call failed with status: ${response.status}. Body: ${errorBody}`
    );
  }

  const result = response.data;

  const candidate = result.candidates?.[0];

  if (!candidate || !candidate.content || !candidate.content.parts) {
    console.error("[AI DEBUG] LỖI: Cấu trúc response không hợp lệ", result);
    throw new Error("Lỗi cấu trúc response từ Gemini.");
  }

  const modelResponsePart = candidate.content.parts[0];

  if (modelResponsePart.functionCall) {
    const functionCall = modelResponsePart.functionCall;
    const functionName = functionCall.name;
    const args = functionCall.args;

    console.log(`[AI DEBUG] AI Yêu cầu gọi Tool: ${functionName}`);
    history.push(candidate.content);

    let functionResult;

    if (functionName === "find_trips") {
      functionResult = await callYourTripAPI(
        args.departure,
        args.destination,
        args.date
      );
    } else if (functionName === "get_available_seats") {
      functionResult = await callYourSeatAPI(args.tripId, args.numSeats);
    } else if (functionName === "calculate_final_price") {
      functionResult = await callYourPriceCalculationAPI(
        args.tripId,
        args.seatIds,
        args.promoCode
      );
    } else if (functionName === "book_ticket") {
      functionResult = await callYourBookingAPI(
        args.tripId,
        args.seatIds,
        args.passengerInfo,
        args.pickupPointName,
        args.dropoffPointName,
        args.paymentMethod,
        args.promoCode,
        userId
      );
    } else {
      console.warn(`[AI DEBUG] Tool không xác định: ${functionName}`);
      functionResult = { success: false, error: "Tool không xác định" };
    }

    history.push({
      role: "function",
      parts: [
        {
          functionResponse: {
            name: functionName,
            response: functionResult,
          },
        },
      ],
    });

    return run(history);
  } else if (modelResponsePart.text) {
    const botReply = modelResponsePart.text;
    history.push({ role: "model", parts: [{ text: botReply }] });
    return { reply: botReply, newHistory: history };
  }

  console.error(
    "[AI DEBUG] LỖI: Không phải text hay function call",
    modelResponsePart
  );
  throw new Error("Không nhận được text hoặc function call từ AI.");
}

export default processMessage;
