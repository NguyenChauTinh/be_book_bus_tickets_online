import express from "express";
import {
  getNotificationsByUserId,
  markNotificationAsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

// Route chính để App gọi: GET /api/v1/notifications/user/:userId
router.get("/user/:userId", getNotificationsByUserId);

// (Tùy chọn) Route để App gọi khi người dùng bấm vào xem thông báo
router.put("/:notificationId/read", markNotificationAsRead);

export default router;
