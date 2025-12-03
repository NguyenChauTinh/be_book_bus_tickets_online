import amqp from "amqplib";
import {
  RABBITMQ_URL,
  NOTIFICATION_EXCHANGE,
  UPDATE_SEAT_EXCHANGE,
  TRIP_SERVICE_ROUTING_KEY,
} from "../config/env.js";

export let amqpChannel = null;

export async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    amqpChannel = await connection.createChannel();

    await amqpChannel.assertExchange(NOTIFICATION_EXCHANGE, "fanout", {
      durable: true,
    });
    await amqpChannel.assertExchange(UPDATE_SEAT_EXCHANGE, "direct", {
      durable: true,
    });
    console.log("Booking Service đã kết nối RabbitMQ và khai báo Exchange.");
  } catch (error) {
    console.error("LỖI KẾT NỐI RABBITMQ (Producer):", error.message);
    amqpChannel = null;
  }
}
export function publishEvent(eventType, payload, email = null, phone = null) {
  if (!amqpChannel) {
    console.error("Lỗi: Không có kết nối RabbitMQ. Không thể gửi sự kiện.");
    return false;
  }

  const message = {
    type: eventType,
    userId: payload.userId || null,
    email: email,
    phone: phone,
    payload: payload,
    timestamp: new Date().toISOString(),
  };

  try {
    amqpChannel.publish(
      NOTIFICATION_EXCHANGE,
      "",
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    console.log(
      `[EVENT PUBLISHED] ${eventType} | Email: ${email} | Phone: ${phone}`
    );
    return true;
  } catch (error) {
    console.error(`[PUBLISH ERROR] Không thể gửi message: ${error.message}`);
    return false;
  }
}
export function publishSeatUpdateCommand(chuyenXeId, changeAmount) {
    if (!amqpChannel) {
        console.error("Lỗi: Không có kết nối RabbitMQ. Không thể gửi lệnh cập nhật ghế.");
        return false;
    }

    const command = {
        commandType: "UPDATE_SEATS",
        chuyenXeId: chuyenXeId,
        changeAmount: changeAmount, 
        timestamp: new Date().toISOString(),
        serviceSource: "BOOKING-SERVICE"
    };

    try {
        amqpChannel.publish(
            UPDATE_SEAT_EXCHANGE, 
            TRIP_SERVICE_ROUTING_KEY, 
            Buffer.from(JSON.stringify(command)),
            { persistent: true } 
        );
        console.log(`[COMMAND PUBLISHED] UPDATE_SEATS: Cập nhật ghế cho chuyến ${chuyenXeId} | Lượng thay đổi: ${changeAmount}`);
        return true;
    } catch (error) {
        console.error(`[PUBLISH ERROR] Không thể gửi lệnh cập nhật ghế: ${error.message}`);
        return false;
    }
}