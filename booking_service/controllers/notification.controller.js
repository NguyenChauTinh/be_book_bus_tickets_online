import Notification from "../models/notification.model.js"; // Import model bạn vừa tạo

/**
 * @desc Lấy danh sách thông báo cho một người dùng cụ thể
 * @route GET /api/v1/notifications/user/:userId
 * @access Public (hoặc Private nếu bạn có cơ chế auth)
 * @params {String} userId - ID của người dùng (từ microservice khác)
 */
export const getNotificationsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng cung cấp userId." });
    }

    // Tìm tất cả thông báo của user đó, sắp xếp mới nhất lên đầu, giới hạn 20
    const notifications = await Notification.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(20) // Lấy 20 thông báo mới nhất
      .exec();

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Lỗi khi lấy thông báo:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};

/**
 * @desc (Tùy chọn) Hàm để đánh dấu thông báo đã đọc
 * @route PUT /api/v1/notifications/:notificationId/read
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true } // Trả về bản ghi đã cập nhật
    );

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy thông báo." });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error("Lỗi khi đánh dấu đã đọc:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ." });
  }
};
