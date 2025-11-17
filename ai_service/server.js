// server.js
import express from "express";
import cors from "cors";

import processMessage from "./geminiService.be.js";

const app = express();
app.use(cors()); // Cho phép React Native gọi
app.use(express.json());

// Đây là "bộ nhớ" tạm thời của server để lưu lịch sử chat.
// Key là sessionId (từ frontend), Value là mảng lịch sử chat
// Để dùng trong production, bạn nên thay bằng Redis hoặc CSDL.
const chatHistories = new Map();

// Endpoint duy nhất mà React Native sẽ gọi
app.post("/api/v1/chat", async (req, res) => {
  try {
    const { userInput, sessionId } = req.body;

    if (!userInput || !sessionId) {
      return res
        .status(400)
        .json({ error: "userInput và sessionId là bắt buộc." });
    }

    // 1. Lấy lịch sử chat của user này, hoặc tạo mới nếu chưa có
    let history = chatHistories.get(sessionId) || [];

    // 2. Gọi "bộ não" AI (đã được refactor)
    // Nó sẽ tự động gọi Gemini, gọi tool, và trả về kết quả cuối
    const { reply, newHistory } = await processMessage(userInput, history);

    // 3. Lưu lại lịch sử chat đã được cập nhật
    chatHistories.set(sessionId, newHistory);

    // 4. Trả về *chỉ* câu trả lời cho frontend
    res.json({ reply });
  } catch (error) {
    console.error("Lỗi nghiêm trọng tại /api/v1/chat:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi hệ thống." });
  }
});

// Thường dùng cổng 3006 cho backend, vì 3000 hay dùng cho React/Next.js
const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`🤖 Chat server đang chạy trên cổng ${PORT}`);
});
