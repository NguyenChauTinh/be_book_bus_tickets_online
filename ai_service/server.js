// server.js
import express from "express";
import cors from "cors";

import { PORT, API_GEMINI_KEY } from "./config/env.js";
import processMessage from "./geminiService.be.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const chatHistories = new Map();
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'API Gateway is Healthy' });
});
app.post("/api/v1/chat", async (req, res) => {
  try {
    const { userInput, userId, sessionId } = req.body;

    if (!userInput || !sessionId) {
      return res
        .status(400)
        .json({ error: "userInput và sessionId là bắt buộc." });
    }

    let history = chatHistories.get(sessionId) || [];

    const { reply, newHistory } = await processMessage(userInput, history, userId);

    chatHistories.set(sessionId, newHistory);

    res.status(200).json({success: true, reply });
  } catch (error) {
    console.error("Lỗi nghiêm trọng tại /api/v1/chat:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi hệ thống." });
  }
});


app.listen(PORT, () => {
  console.log(`Chat server đang chạy trên cổng ${PORT}`);
  console.log(`API KEY : `, API_GEMINI_KEY);
});

