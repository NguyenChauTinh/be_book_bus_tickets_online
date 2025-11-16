import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import crypto from "crypto";
import queryString from "qs";

// 🚀 THÊM MỚI: Imports cho Socket.IO
import http from "http";
import { Server } from "socket.io";

import ngrok from "ngrok";
import { NGROK_AUTH_TOKEN, PORT } from "./config/env.js";
import connectToDatabase from "./database/mongodb.js";
import veXeRouter from "./routes/veXe.route.js";
import paymentRouter from "./routes/payment.route.js";
import notificationRouter from "./routes/notification.route.js";

dotenv.config();

const app = express();

// 🚀 THÊM MỚI: Tạo server HTTP và Socket.IO
// Bọc 'app' của Express bằng 'http' server
const server = http.createServer(app);
// Khởi tạo Socket.IO trên http server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // 👈 Cổng của trang React Admin
    methods: ["GET", "POST"],
  },
});

// 🚀 THÊM MỚI: Lắng nghe kết nối từ Admin
io.on("connection", (socket) => {
  console.log("Một admin đã kết nối (Socket.IO):", socket.id);
  socket.on("disconnect", () => {
    console.log("Admin đã ngắt kết nối (Socket.IO):", socket.id);
  });
});

// --- Middleware của Express ---
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// 🚀 THÊM MỚI: Middleware để gán 'io' vào mọi request (req)
// Việc này giúp các file controller (như veXe.controller.js) có thể gọi req.io
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- Routes ---
app.use("/api/v1/ve-xe", veXeRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/notifications", notificationRouter);
// app.use(errorMiddleware);

// --- Logic VNPAY (Giữ nguyên) ---
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(key);
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
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
    "0"(date.getMonth() + 1).slice(-2) +
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
  vnp_Params["vnp_Amount"] = Math.round(amount * 100);
  vnp_Params["vnp_CreateDate"] = createDate;
  vnp_Params["vnp_CurrCode"] = "VND";
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_Locale"] = "vn";
  vnp_Params["vnp_OrderInfo"] = orderInfo;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_TxnRef"] = orderId;

  console.log("--- VNPAY PARAMS (RAW) ---");
  console.log(vnp_Params);

  let sorted_Params_for_sign = sortObject(vnp_Params);
  let signData = queryString.stringify(sorted_Params_for_sign, {
    encode: false,
  });

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

// --- Khởi chạy Server ---
const startServer = async () => {
  try {
    await connectToDatabase();

    // 🚀 THAY ĐỔI: Dùng 'server.listen' thay vì 'app.listen'
    server.listen(PORT, () => {
      console.log(
        `Booking service (with Socket.IO) is running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start the server", error);
    process.exit(1);
  }
};

startServer();
