import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv"; // LỖI 4: Thêm import dotenv
import crypto from "crypto"; // LỖI 3: Sửa 'require' thành 'import'
import queryString from "qs"; // LỖI 3: Sửa 'require' thành 'import'

import ngrok from "ngrok";
import { NGROK_AUTH_TOKEN, PORT } from "./config/env.js";
import connectToDatabase from "./database/mongodb.js";
import veXeRouter from "./routes/veXe.route.js";
import paymentRouter from "./routes/payment.route.js";

dotenv.config(); // LỖI 4: Cấu hình dotenv ở đầu file

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  cors({
    origin: true, // <-- Bỏ dòng này
    // origin: "*",  // <-- Thêm dòng này (Cho phép tất cả)
    credentials: true,
    // methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    // allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/v1/ve-xe", veXeRouter);
app.use("/api/v1/payment", paymentRouter);
// app.use(errorMiddleware);

// LỖI 2: Hàm sortObject bị thiếu đã được thêm vào
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(key); // SỬA: Chỉ push key, không encode
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    // SỬA: Dùng key gốc (str[key]) để lấy value từ obj
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

app.post("/api/v1/payment/create-vnpay-url", (req, res) => {
  const tmnCode = process.env.VNP_TMNCODE;
  const secretKey = process.env.VNP_HASHSECRET;
  const vnpUrl = process.env.VNP_URL;
  const returnUrl = process.env.VNP_RETURN_URL;

  let ipAddr = req.ip;
  if (ipAddr.substr(0, 7) == "::ffff:") {
    ipAddr = ipAddr.substr(7);
  }
  const isPrivateIp =
    /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|::1)/.test(ipAddr);
  if (isPrivateIp || ipAddr === "127.0.0.1") {
    ipAddr = "127.0.0.1";
  }

  const date = new Date();
  const createDate =
    date.getFullYear().toString() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

  const orderId = `order_${Date.now()}`;
  const amount = req.body.amount;
  // SỬA TẠM THỜI: Xóa dấu tiếng Việt để test
  const orderInfo = req.body.orderInfo || "Thanh toan don hang";

  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Amount"] = Math.round(amount * 100);
  vnp_Params["vnp_CreateDate"] = createDate;
  vnp_Params["vnp_CurrCode"] = "VND";
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_Locale"] = "vn";
  vnp_Params["vnp_OrderInfo"] = orderInfo;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_TxnRef"] = orderId;

  // ======================================================================
  // DEBUG LOG 1: In ra các tham số GỐC
  console.log("--- VNPAY PARAMS (RAW) ---");
  console.log(vnp_Params);
  // ======================================================================

  let sorted_Params_for_sign = sortObject(vnp_Params);
  let signData = queryString.stringify(sorted_Params_for_sign, {
    encode: false,
  });

  // ======================================================================
  // DEBUG LOG 2: In ra chuỗi data để tạo chữ ký
  console.log("--- VNPAY SIGN DATA ---");
  console.log(signData);

  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  sorted_Params_for_sign["vnp_SecureHash"] = signed;

  const finalVnpUrl =
    vnpUrl +
    "?" +
    queryString.stringify(sorted_Params_for_sign, { encode: false });

  console.log("--- VNPAY HASH ---");
  console.log(signed);
  console.log("--- VNPAY FINAL URL ---");
  console.log(finalVnpUrl);

  res.json({ paymentUrl: finalVnpUrl });
});

const startServer = async () => {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Booking service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server", error);
    process.exit(1);
  }
};

startServer();
