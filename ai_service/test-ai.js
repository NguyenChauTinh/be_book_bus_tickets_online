// File: test-ai.js
import axios from "axios";

// 1. Dùng KEY của bạn (Gắn cứng để test)
const API_KEY = "";

// Thêm đuôi -001 vào sau tên model
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;
async function testGemini() {
  console.log("--- BẮT ĐẦU TEST KẾT NỐI GEMINI ---");
  console.log("Đang gọi tới:", URL);

  try {
    const response = await axios.post(
      URL,
      {
        contents: [{ parts: [{ text: "Xin chào, đây là test kết nối." }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("\n✅ KẾT QUẢ: THÀNH CÔNG!");
    console.log(
      "Gemini trả lời:",
      response.data.candidates[0].content.parts[0].text
    );
  } catch (error) {
    console.log("\n❌ KẾT QUẢ: THẤT BẠI");
    if (error.response) {
      console.log("Status Code:", error.response.status); // 404, 400, 403...
      console.log("Dữ liệu lỗi:", error.response.data); // Google sẽ nói rõ tại sao lỗi
    } else {
      console.log("Lỗi mạng/Code:", error.message);
    }
  }
}

testGemini();
