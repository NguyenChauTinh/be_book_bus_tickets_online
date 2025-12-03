import amqp from "amqplib";
import {
  RABBITMQ_URL,
  NOTIFICATION_EXCHANGE,
  SEARCH_HISTORY_EXCHANGE,
  SEARCH_HISTORY_QUEUE,
  SEARCH_HISTORY_ROUTING_KEY,
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

    await amqpChannel.assertExchange(SEARCH_HISTORY_EXCHANGE, "direct", {
      durable: true,
    });

    const q = await amqpChannel.assertQueue(SEARCH_HISTORY_QUEUE, {
      durable: true,
    });

    await amqpChannel.bindQueue(
      q.queue,
      SEARCH_HISTORY_EXCHANGE,
      SEARCH_HISTORY_ROUTING_KEY
    );
    console.log("Auth Service đã kết nối RabbitMQ và khai báo Exchange.");

    await amqpChannel.consume(q.queue, processSearchHistoryMessage, {
      noAck: false,
    });
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
        { $push: { 
            lichSuTimKiem: {
                $each: [newHistoryEntry],
                $sort: { timestamp: -1 }, 
                $slice: 20 
            }
        }},
        { new: true, runValidators: true } 
    );
    if (updatedAccount) {
        console.log(`[Lịch sử tìm kiếm] Đã cập nhật thành công cho user: ${content.userId}`);
    } else {
        console.warn(`[Lịch sử tìm kiếm] Không tìm thấy tài khoản để cập nhật ID: ${content.userId}`);
    }
    amqpChannel.ack(msg);
  } catch (error) {
    console.error("Lỗi xử lý message lịch sử tìm kiếm:", error);
    amqpChannel.nack(msg);
  }
};
