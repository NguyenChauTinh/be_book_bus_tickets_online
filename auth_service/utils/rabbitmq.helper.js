import amqp from "amqplib";
import {
  RABBITMQ_URL,
  NOTIFICATION_EXCHANGE,
  HISTORY_SEARCH_EXCHANGE,
  SEARCH_HISTORY_QUEUE,
  HISTORY_SEARCH_ROUTING_KEY,
} from "../config/env.js";
import TaiKhoanKhachHang from "../models/taiKhoanKhachHang.model.js";
export let amqpChannel = null;
export async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    amqpChannel = await connection.createChannel();

    await amqpChannel.assertExchange(NOTIFICATION_EXCHANGE, "fanout", {
      durable: true,
    });

    await amqpChannel.assertExchange(HISTORY_SEARCH_EXCHANGE, "direct", {
      durable: true,
    });

    const q = await amqpChannel.assertQueue(SEARCH_HISTORY_QUEUE, {
      durable: true,
    });

    await amqpChannel.bindQueue(
      q.queue,
      HISTORY_SEARCH_EXCHANGE,
      HISTORY_SEARCH_ROUTING_KEY
    );
    const USER_UPDATE_QUEUE = "user_booking_updates_queue";

    await amqpChannel.consume(q.queue, processSearchHistoryMessage, {
      noAck: false,
    });
    const qUserUpdate = await amqpChannel.assertQueue(USER_UPDATE_QUEUE, {
      durable: true,
    });
    await amqpChannel.bindQueue(qUserUpdate.queue, NOTIFICATION_EXCHANGE, "");

    await amqpChannel.consume(qUserUpdate.queue, processUserUpdateMessage, {
      noAck: false,
    });
    console.log("Auth Service đã kết nối RabbitMQ và khai báo Exchange.");
  } catch (error) {
    console.error("LỖI KẾT NỐI RABBITMQ (Producer):", error.message);
    amqpChannel = null;
  }
}
export function publishEvent(eventType, payload, email, phone) {
  if (!amqpChannel) {
    console.error("Lỗi: Không có kết nối RabbitMQ. Không thể gửi sự kiện.");
    return false;
  }
  const message = {
    type: eventType,
    userId: payload.userId,
    email: email,
    phone: phone,
    payload: {
      ...payload,
    },
    timestamp: new Date().toISOString(),
  };

  amqpChannel.publish(
    NOTIFICATION_EXCHANGE,
    "",
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );
  console.log(
    `[EVENT PUBLISHED] Loại: ${eventType} | Dữ liệu đã được gửi đến RabbitMQ.`
  );
  return true;
}

const processSearchHistoryMessage = async (msg) => {
  try {
    const content = JSON.parse(msg.content.toString());

    const newHistoryEntry = {
      diemDiId: content.diemDiId,
      diemDenId: content.diemDenId,
      tenDiemDi: content.tenDiemDi,
      tenDiemDen: content.tenDiemDen,
      ngayKhoiHanh: new Date(content.ngayKhoiHanh),
      timestamp: content.timestamp ? new Date(content.timestamp) : Date.now(),
    };

    const updatedAccount = await TaiKhoanKhachHang.findByIdAndUpdate(
      content.userId,
      {
        $push: {
          lichSuTimKiem: {
            $each: [newHistoryEntry],
            $sort: { timestamp: -1 },
            $slice: 50,
          },
        },
      },
      { new: true, runValidators: true }
    );
    if (updatedAccount) {
      console.log(
        `[Lịch sử tìm kiếm] Đã cập nhật thành công cho user: ${content.userId}`
      );
    } else {
      console.warn(
        `[Lịch sử tìm kiếm] Không tìm thấy tài khoản để cập nhật ID: ${content.userId}`
      );
    }
    amqpChannel.ack(msg);
  } catch (error) {
    console.error("Lỗi xử lý message lịch sử tìm kiếm:", error);
    amqpChannel.nack(msg);
  }
};
const processUserUpdateMessage = async (msg) => {
  try {
    const content = JSON.parse(msg.content.toString());
    
    if (content.type === 'UPDATE_USER_BOOKING_STATS') {
        const { userId, payload } = content;
        const incrementAmount = payload.incrementAmount || 0;

        const updatedUser = await TaiKhoanKhachHang.findByIdAndUpdate(
            userId,
            { 
                $inc: { soLuongVeDaDat: incrementAmount } 
            },
            { new: true }
        );

        if (updatedUser) {
            console.log(`[User Stats] Đã cộng thêm ${incrementAmount} vé cho User: ${userId}`);
        } else {
            console.warn(`[User Stats] Không tìm thấy User ID: ${userId} để cập nhật vé.`);
        }
    }

    amqpChannel.ack(msg);

  } catch (error) {
    console.error("Lỗi xử lý message cập nhật User:", error);
    amqpChannel.nack(msg); 
  }
};