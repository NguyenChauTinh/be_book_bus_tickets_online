import amqp from 'amqplib';
import { RABBITMQ_URL, NOTIFICATION_EXCHANGE } from '../config/env.js';
export let amqpChannel = null;
export async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        amqpChannel = await connection.createChannel();
        
        // Khai báo Exchange (Fanout)
        await amqpChannel.assertExchange(NOTIFICATION_EXCHANGE, 'fanout', { durable: true });
        console.log("Booking Service đã kết nối RabbitMQ và khai báo Exchange.");
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
        timestamp: new Date().toISOString()
    };

    // Publish tin nhắn lên Exchange
    amqpChannel.publish(
        NOTIFICATION_EXCHANGE,
        '', // Routing Key rỗng vì đây là Fanout Exchange
        Buffer.from(JSON.stringify(message)),
        { persistent: true } // Đảm bảo tin nhắn không bị mất khi RabbitMQ sập
    );
    console.log(`[EVENT PUBLISHED] Loại: ${eventType} | Dữ liệu đã được gửi đến RabbitMQ.`);
    return true;
}