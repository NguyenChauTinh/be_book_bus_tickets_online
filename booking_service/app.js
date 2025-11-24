import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import crypto from "crypto";
import queryString from "qs";
import http from "http";
import { Server } from "socket.io";
import { PORT } from "./config/env.js";
import connectToDatabase from "./database/mongodb.js";
import veXeRouter from "./routes/veXe.route.js";
import paymentRouter from "./routes/payment.route.js";
import notificationRouter from "./routes/notification.route.js";
import baoCaoRouter from "./routes/baoCao.route.js";
import { connectRabbitMQ } from "./utils/rabbitmq.helper.js";

dotenv.config();

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

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

app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- Routes ---
app.use("/api/v1/ve-xe", veXeRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/bao-cao", baoCaoRouter);

// app.use(errorMiddleware);


const startServer = async () => {
  try {
    await connectToDatabase();
    await connectRabbitMQ();
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
