import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import queryString from "qs";
import http from "http";
import { Server } from "socket.io";
import { PORT, JWT_SECRET } from "./config/env.js";
import connectToDatabase from "./database/mongodb.js";
import veXeRouter from "./routes/veXe.route.js";
import paymentRouter from "./routes/payment.route.js";
import notificationRouter from "./routes/notification.route.js";
import baoCaoRouter from "./routes/baoCao.route.js";
import { connectRabbitMQ } from "./utils/rabbitmq.helper.js";
import { connectToEureka, disconnectEureka } from "./config/eureka.js";

dotenv.config();

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", 
    methods: ["GET", "POST"],
    credentials: true 
  }
});
io.setMaxListeners(20);
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Không có token xác thực")); 
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next(); 
  } catch (err) {
    return next(new Error("Lỗi xác thực token")); 
  }
});

io.on("connection", (client) => {
    console.log(`Socket client connected: ${client.id}`);
    

    client.on("disconnect", () => {
        console.log(`Socket client disconnected: ${client.id}`);
    });
});

// --- Middleware của Express ---
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.get('/info', (req, res) => {
    res.json({ status: 'UP' });
});
app.use(morgan("dev"));
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
    connectToEureka();
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
process.on('SIGINT', () => {
    disconnectEureka();
    process.exit();
});

startServer();
