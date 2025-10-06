import express from "express";
import cors from "cors";
import errorMiddleware from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import { PORT } from "./config/env.js";
import connectDB from "./database/mongodb.js";
import diaDiemRouter from "./routes/diaDiem.routes.js";
import tuyenDuongRouter from "./routes/tuyenDuong.routes.js";
import lichChayRouter from "./routes/lichChay.routes.js";
import loaiXeRouter from "./routes/loaiXe.route.js";
import xeRouter from "./routes/xe.route.js";
import chuyenXeRouter from "./routes/chuyenXe.route.js";
import giaVeRouter from "./routes/giaVe.routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use("/api/v1/dia-diem", diaDiemRouter);
app.use("/api/v1/tuyen-duong", tuyenDuongRouter);
app.use("/api/v1/lich-chay", lichChayRouter);
app.use("/api/v1/chuyen-xe", chuyenXeRouter);
app.use("/api/v1/loai-xe", loaiXeRouter);
app.use("/api/v1/xe", xeRouter);
app.use("/api/v1/gia-ve", giaVeRouter);

app.use(errorMiddleware);

async function startServer() {
  try {
    await connectDB();
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(new Date());
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

export default app;
