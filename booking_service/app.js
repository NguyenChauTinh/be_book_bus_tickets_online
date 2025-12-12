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

dotenv.config();

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
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

// --- KHO LƯU TRỮ TRẠNG THÁI LOCK (In-memory) ---
// Key: "tripId_seatCode" (Ví dụ: "654abc_A01")
// Value: { userId, userName, socketId, timestamp }
const lockedSeats = new Map();

const removeLocksBySocket = (socketId, io) => {
  for (const [key, value] of lockedSeats.entries()) {
    if (value.socketId === socketId) {
      lockedSeats.delete(key);
      const [tripId, seatCode] = key.split("_");

      // Báo cho mọi người trong chuyến xe đó biết ghế đã mở
      io.to(tripId).emit("SEAT_UNLOCKED", { seatCode });
      console.log(`Auto unlocked seat ${seatCode} due to disconnect`);
    }
  }
};

io.on("connection", (client) => {
  console.log(`Socket client connected: ${client.id}`);
  const user = client.user;

  if (!user) {
    console.error("Socket connected but no user found in socket.user");
    return;
  }
  console.log("Danh sách ghế bị lock: ", lockedSeats);

  client.on("JOIN_TRIP", (tripId) => {
    client.join(tripId);

    // Gửi ngay danh sách các ghế đang bị lock của chuyến này cho user mới vào
    const currentLocks = [];
    lockedSeats.forEach((val, key) => {
      if (key.startsWith(tripId)) {
        currentLocks.push({
          seatCode: key.split("_")[1],
          lockedBy: val.userName,
          selfLocked: val.userId === user.id, // Đánh dấu nếu chính mình đang lock
        });
      }
    });
    client.emit("SYNC_LOCKS", currentLocks);
  });

  // 2. User chọn (click) vào một ghế -> Yêu cầu Lock
  client.on("LOCK_SEAT", ({ tripId, seatCode }) => {
    const key = `${tripId}_${seatCode}`;

    // Kiểm tra xem ghế đã bị ai lock chưa
    if (lockedSeats.has(key)) {
      const existingLock = lockedSeats.get(key);
      if (existingLock.userId !== user.userId) {
        // Nếu người khác đã lock -> Báo lỗi về cho client
        return client.emit("LOCK_FAILED", {
          seatCode,
          message: `Ghế đang được thao tác bởi ${existingLock.userName}`,
        });
      }
      // Nếu chính mình lock thì không làm gì (hoặc gia hạn time)
      return;
    }

    // Thực hiện Lock
    lockedSeats.set(key, {
      userId: user.userId,
      userName: user.tenNhanVien || "Nhân viên",
      socketId: client.id,
      timestamp: Date.now(),
    });

    // Phát sự kiện cho TẤT CẢ mọi người trong phòng (trừ người gửi)
    client.to(tripId).emit("SEAT_LOCKED", {
      seatCode,
      lockedBy: user.tenNhanVien || "Nhân viên",
    });

    // Phản hồi thành công cho người gửi (để họ hiện UI active)
    client.emit("LOCK_SUCCESS", { seatCode });

    // [TÙY CHỌN] Auto unlock sau 5 phút để tránh treo ghế
    setTimeout(() => {
      if (lockedSeats.has(key) && lockedSeats.get(key).socketId === client.id) {
        lockedSeats.delete(key);
        io.to(tripId).emit("SEAT_UNLOCKED", { seatCode });
      }
    }, 3 * 60 * 1000);
  });

  // 3. User bỏ chọn ghế hoặc đóng modal -> Unlock
  client.on("UNLOCK_SEAT", ({ tripId, seatCode }) => {
    const key = `${tripId}_${seatCode}`;
    const lockInfo = lockedSeats.get(key);

    // Chỉ cho phép unlock nếu chính người đó đang lock (hoặc là Admin quyền cao)
    if (lockInfo && lockInfo.userId === user.userId) {
      lockedSeats.delete(key);
      // Báo cho mọi người biết ghế đã mở
      client.to(tripId).emit("SEAT_UNLOCKED", { seatCode });
    }
  });

  // 4. Xử lý khi user mất kết nối (tắt tab, mất mạng)
  client.on("disconnect", () => {
    console.log(`Socket client disconnected: ${client.id}`);
    removeLocksBySocket(client.id, io);
  });
});

// --- Middleware của Express ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.get("/info", (req, res) => {
  res.json({ status: "UP" });
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
