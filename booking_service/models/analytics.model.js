import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false, // Có thể null nếu khách vãng lai chưa đăng nhập
    },
    bookingMethod: {
      type: String,
      enum: ["MANUAL", "AI_CHATBOT"], // Chỉ chấp nhận 2 giá trị này
      required: true,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "ABANDONED", "FAILED"], // Thành công | Bỏ dở | Lỗi hệ thống
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    durationSeconds: {
      type: Number,
      required: true, // Thời gian hoàn thành (giây)
    },
    stepCount: {
      type: Number,
      default: 0, // Số bước thao tác
    },
    deviceInfo: {
      type: String, // Ví dụ: "iPhone 14 - iOS 17.0"
      default: "Unknown",
    },
    // Lưu thêm metadata nếu cần (ví dụ: mã vé đã đặt được)
    metaData: {
      tripId: String,
      ticketId: String,
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
    collection: "BookingPerformanceLogs", // Tên collection trong MongoDB
  }
);

const AnalyticsModel = mongoose.model("Analytics", analyticsSchema);

export default AnalyticsModel;
