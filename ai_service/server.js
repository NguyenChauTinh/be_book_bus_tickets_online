// server.js
import express from "express";
import cors from "cors";

import { PORT } from "./config/env.js";
import { connectToEureka, disconnectEureka } from "./config/eureka.js";
import processMessage from "./geminiService.be.js";

const app = express();
app.use(cors()); // Cho phép React Native gọi
app.use(express.json());

const chatHistories = new Map();

app.post("/api/v1/chat", async (req, res) => {
  try {
    const { userInput, sessionId } = req.body;

    if (!userInput || !sessionId) {
      return res
        .status(400)
        .json({ error: "userInput và sessionId là bắt buộc." });
    }

    let history = chatHistories.get(sessionId) || [];

    const { reply, newHistory } = await processMessage(userInput, history);

    chatHistories.set(sessionId, newHistory);

    res.status(200).json({success: true, reply });
  } catch (error) {
    console.error("Lỗi nghiêm trọng tại /api/v1/chat:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi hệ thống." });
  }
});


app.listen(PORT, () => {
  connectToEureka();
  console.log(`Chat server đang chạy trên cổng ${PORT}`);
});

process.on('SIGINT', () => {
  disconnectEureka();
  process.exit();
});