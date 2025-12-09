import express from "express";
import cors from "cors";
import errorMiddleware from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import { PORT } from "./config/env.js";
import { connectRabbitMQ } from "./utils/rabbitmq.helper.js";
import connectDB from "./database/mongodb.js";
import diaDiemRouter from "./routes/diaDiem.routes.js";
import tuyenDuongRouter from "./routes/tuyenDuong.routes.js";
import lichChayRouter from "./routes/lichChay.routes.js";
import loaiXeRouter from "./routes/loaiXe.route.js";
import xeRouter from "./routes/xe.route.js";
import chuyenXeRouter from "./routes/chuyenXe.route.js";
import giaVeRouter from "./routes/giaVe.routes.js";
import DonViCongTacRouter from "./routes/donViCongTac.route.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: true, 
    credentials: true,
  })
);
app.use((req, res, next) => {
    console.log(`[DEBUG AUTH] URL Nhận được: ${req.url}`);
    next();
});
app.get('/', (req, res) => {
    res.status(200).json({ status: 'API Gateway is Healthy' });
});
app.use("/api/v1/dia-diem", diaDiemRouter);
app.use("/api/v1/tuyen-duong", tuyenDuongRouter);
app.use("/api/v1/lich-chay", lichChayRouter);
app.use("/api/v1/chuyen-xe", chuyenXeRouter);
app.use("/api/v1/loai-xe", loaiXeRouter);
app.use("/api/v1/xe", xeRouter);
app.use("/api/v1/gia-ve", giaVeRouter);
app.use("/api/v1/don-vi-cong-tac", DonViCongTacRouter);
app.use(errorMiddleware);

async function startServer() {
  try {
    await connectDB();
    await connectRabbitMQ();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(new Date());
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();



export default app;
