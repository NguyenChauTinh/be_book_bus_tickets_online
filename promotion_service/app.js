import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { PORT } from "./config/env.js";
import connectToDatabase from "./database/mongodb.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import khuyenMaiRouter from "./routes/khuyenMai.route.js";

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
app.use("/api/v1/khuyen-mai", khuyenMaiRouter);

app.listen(PORT, async () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
  console.log(new Date());
  await connectToDatabase();
});

export default app;
