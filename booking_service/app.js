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
