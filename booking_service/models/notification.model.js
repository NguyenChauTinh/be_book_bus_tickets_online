import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Hoặc bạn có thể dùng 'String' nếu ID user không phải là ObjectId
      required: true,
      index: true, // Thêm index để tối ưu truy vấn theo userId
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    type: { type: String, enum: ["trip", "promotion"], default: "trip" },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
