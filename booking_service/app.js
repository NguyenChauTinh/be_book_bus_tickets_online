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
import baoCaoRouter from "./routes/baoCao.route.js";

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
app.use("/api/v1/bao-cao", baoCaoRouter);

// app.use(errorMiddleware);


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
