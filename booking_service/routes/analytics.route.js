import express from "express";
import AnalyticsModel from "../models/analytics.model.js";

const router = express.Router();

// API: POST /api/v1/analytics/log-performance
router.post("/log-performance", async (req, res) => {
  try {
    const {
      userId,
      bookingMethod,
      status,
      startTime,
      endTime,
      stepCount,
      deviceInfo,
      metaData,
    } = req.body;

    // Tính toán lại duration để đảm bảo chính xác (Server side calculation)
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationSeconds = (end - start) / 1000;

    const newLog = new AnalyticsModel({
      userId,
      bookingMethod,
      status,
      startTime: start,
      endTime: end,
      durationSeconds, // Lưu số giây đã tính
      stepCount,
      deviceInfo,
      metaData,
    });

    await newLog.save();

    return res.status(200).json({
      message: "Log saved successfully",
      data: newLog,
    });
  } catch (error) {
    console.error("Error logging performance:", error);
    return res.status(500).json({
      message: "Failed to save log",
      error: error.message,
    });
  }
});

export default router;
