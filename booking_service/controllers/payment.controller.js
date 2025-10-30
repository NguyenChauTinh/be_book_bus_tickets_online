import HoaDon from "../models/hoaDon.model.js";
import VeXe from "../models/veXe.model.js";
import {
  VNP_TMNCODE,
  VNP_HASHSECRET,
  VNP_URL,
  VNP_RETURN_URL,
  VNP_IPN_URL,
} from "../config/env.js";
import moment from "moment";
import querystring from "qs";
import crypto from "crypto";

export const createPaymentUrl = async (req, res) => {
  try {
    const { maVe, chiTietVeIds, amount } = req.body; // Client gửi lên mã vé, danh sách ID chi tiết vé cần thanh toán, và tổng tiền
    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    // B1: Kiểm tra và tìm vé xe
    const veXe = await VeXe.findOne({ maVe });
    if (!veXe) {
      return res.status(404).json({ message: "Không tìm thấy vé xe." });
    }

    // B2: Tạo một hóa đơn mới ở trạng thái "chờ thanh toán"
    const newHoaDon = new HoaDon({
      maHoaDon: moment().format("DDHHmmss"), // Tạo mã hóa đơn duy nhất
      veXe: veXe._id,
      chiTietVeThanhToan: chiTietVeIds,
      soTien: amount,
      phuongThuc: "VNPAY",
      trangThai: "CHO_THANH_TOAN",
      noiDungThanhToan: `Thanh toan ve xe ${maVe}`,
    });
    await newHoaDon.save();

    // B3: Tạo URL thanh toán VNPAY
    const tmnCode = VNP_TMNCODE;
    const secretKey = VNP_HASHSECRET;
    let vnpUrl = VNP_URL;
    const returnUrl = VNP_RETURN_URL;
    const createDate = moment().format("YYYYMMDDHHmmss");

    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = newHoaDon.maHoaDon;
    vnp_Params["vnp_OrderInfo"] = newHoaDon.noiDungThanhToan;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = amount * 100; // VNPAY yêu cầu nhân 100
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;
    vnp_Params["vnp_IpnURL"] = VNP_IPN_URL; // Thêm URL IPN

    vnp_Params = sortObject(vnp_Params);
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;

    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

    res.status(200).json({ paymentUrl: vnpUrl });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
// payment.controller.js (tiếp theo)

export const vnpay_ipn = async (req, res) => {
  let vnp_Params = req.query;
  const secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);
  const secretKey = VNP_HASHSECRET;
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

  // B1: Xác thực chữ ký
  if (secureHash === signed) {
    const maHoaDon = vnp_Params["vnp_TxnRef"];
    const rspCode = vnp_Params["vnp_ResponseCode"];

    // B2: Tìm hóa đơn và kiểm tra trạng thái
    const hoaDon = await HoaDon.findOne({ maHoaDon: maHoaDon });
    if (!hoaDon) {
      return res
        .status(200)
        .json({ RspCode: "01", Message: "Order not found" });
    }
    if (hoaDon.trangThai !== "CHO_THANH_TOAN") {
      return res
        .status(200)
        .json({ RspCode: "02", Message: "Order already confirmed" });
    }

    // B3: Cập nhật trạng thái hóa đơn và vé xe
    if (rspCode === "00") {
      // Giao dịch thành công
      hoaDon.trangThai = "THANH_CONG";
      hoaDon.maGiaoDichVNPAY = vnp_Params["vnp_TransactionNo"];
      hoaDon.maNganHangVNPAY = vnp_Params["vnp_BankCode"];
      hoaDon.thoiGianThanhToan = moment(
        vnp_Params["vnp_PayDate"],
        "YYYYMMDDHHmmss"
      ).toDate();
      hoaDon.vnpayResponseData = vnp_Params;
      await hoaDon.save();

      // Cập nhật vé xe và chi tiết vé
      const veXe = await VeXe.findById(hoaDon.veXe);
      if (veXe) {
        veXe.tongTienDaThanhToan += hoaDon.soTien;
        veXe.trangThaiThanhToan =
          veXe.tongTienDaThanhToan >= veXe.tongTien
            ? "DA_THANH_TOAN"
            : "THANH_TOAN_MOT_PHAN";

        // Cập nhật chi tiết vé tương ứng
        hoaDon.chiTietVeThanhToan.forEach((idChiTiet) => {
          const chiTiet = veXe.chiTiet.id(idChiTiet);
          if (chiTiet) {
            chiTiet.trangThaiChiTiet = "DA_THANH_TOAN";
            chiTiet.hinhThucThanhToan = "VNPAY";
            chiTiet.hoaDon = hoaDon._id;
          }
        });
        await veXe.save();
      }
      res.status(200).json({ RspCode: "00", Message: "Success" });
    } else {
      // Giao dịch thất bại
      hoaDon.trangThai = "THAT_BAI";
      hoaDon.vnpayResponseData = vnp_Params;
      await hoaDon.save();
      res.status(200).json({ RspCode: "00", Message: "Success" });
    }
  } else {
    res.status(200).json({ RspCode: "97", Message: "Fail checksum" });
  }
};

export const vnpay_return = async (req, res) => {
  let vnp_Params = req.query;
  const secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);
  const secretKey = VNP_HASHSECRET;
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

  if (secureHash === signed) {
    const rspCode = vnp_Params["vnp_ResponseCode"];

    if (rspCode === "00") {
      res.redirect(
        `https://your-frontend-domain.com/payment-success?orderId=${req.query["vnp_TxnRef"]}`
      );
    } else {
      res.redirect(
        `https://your-frontend-domain.com/payment-failed?orderId=${req.query["vnp_TxnRef"]}`
      );
    }
  } else {
    res.status(200).json({ RspCode: "97", Message: "Fail checksum" });
  }
};
