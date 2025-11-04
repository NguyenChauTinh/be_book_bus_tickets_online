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
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

// LỖI 1: Sửa lại đường dẫn route cho chính xác
app.post("/api/v1/payment/create-vnpay-url", (req, res) => {
  // Lấy thông tin từ .env (Giờ đã hoạt động)
  const tmnCode = process.env.VNP_TMNCODE;
  const secretKey = process.env.VNP_HASHSECRET;
  const vnpUrl = process.env.VNP_URL;
  const returnUrl = process.env.VNP_RETURN_URL; // Dùng biến env cho returnUrl

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
  const orderInfo = req.body.orderInfo || "Thanh toan don hang";
  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Amount"] = amount * 100;
  vnp_Params["vnp_CreateDate"] = createDate;
  vnp_Params["vnp_CurrCode"] = "VND";
  vnp_Params["vnp_IpAddr"] = req.ip || "127.0.0.1";
  vnp_Params["vnp_Locale"] = "vn";
  vnp_Params["vnp_OrderInfo"] = orderInfo;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_TxnRef"] = orderId;

  vnp_Params = sortObject(vnp_Params); // Giờ đã chạy đúng

  const signData = queryString.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  const finalVnpUrl =
    vnpUrl + "?" + queryString.stringify(vnp_Params, { encode: true });

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
