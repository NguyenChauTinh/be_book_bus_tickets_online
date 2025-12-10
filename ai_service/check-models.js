// File: check-models.js
import axios from "axios";

// Key của bạn
const API_KEY = "AIzaSyAaKOXhDKTGKFDH0GvfzEkwR5tabN7Vs14";

// URL đặc biệt để lấy danh sách Model (Method GET)
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listAvailableModels() {
  console.log("--- ĐANG KIỂM TRA DANH SÁCH MODEL ---");
  console.log("URL:", URL);

  try {
    const response = await axios.get(URL);

    console.log("\n✅ KẾT QUẢ: THÀNH CÔNG!");
    console.log("Dưới đây là các model bạn ĐƯỢC PHÉP dùng:");
    console.log("------------------------------------------------");

    const models = response.data.models;
    if (models && models.length > 0) {
      // Lọc ra các model hỗ trợ generateContent
      const chatModels = models.filter((m) =>
        m.supportedGenerationMethods.includes("generateContent")
      );

      chatModels.forEach((m) => {
        console.log(`🔹 Tên: ${m.name}`); // Đây chính là chuỗi bạn cần copy
        console.log(`   Mô tả: ${m.displayName}`);
      });
    } else {
      console.log("⚠️ Danh sách model rỗng! Có vấn đề về tài khoản/Key.");
    }
  } catch (error) {
    console.log("\n❌ KẾT QUẢ: THẤT BẠI");
    if (error.response) {
      console.log("Status Code:", error.response.status);
      console.log("Dữ liệu lỗi:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("Lỗi:", error.message);
    }
  }
}

listAvailableModels();
