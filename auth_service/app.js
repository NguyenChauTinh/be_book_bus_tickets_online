import express from "express";
import cors from "cors";

import { PORT } from "./config/env.js";
import connectToDatabase from "./database/mongodb.js";
import cookieParser from "cookie-parser";
import errorMiddleware from "./middlewares/error.middleware.js";
import nhanVienRouter from "./routes/nhanVien.route.js";
import taiKhoanRouter from "./routes/taiKhoan.route.js";
import vaiTroRouter from "./routes/vaiTro.route.js";
import phanQuyenRouter from "./routes/phanQuyen.route.js";


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


app.use('/api/v1/nhan-vien', nhanVienRouter);

app.use('/api/v1/tai-khoan', taiKhoanRouter);

app.use('/api/v1/vai-tro', vaiTroRouter);

app.use('/api/v1/phan-quyen', phanQuyenRouter);

app.use(errorMiddleware);

app.listen(PORT, async () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
  console.log(new Date());
  await connectToDatabase();
});
export default app;