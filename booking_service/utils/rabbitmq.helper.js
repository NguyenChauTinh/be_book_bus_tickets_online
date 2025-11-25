import amqp from 'amqplib';
import { RABBITMQ_URL, NOTIFICATION_EXCHANGE, NOTIFICATION_QUEUE } from '../config/env.js';

export let amqpChannel = null;

export async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        amqpChannel = await connection.createChannel();
        
        await amqpChannel.assertExchange(NOTIFICATION_EXCHANGE, 'fanout', { durable: true });
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
        timestamp: new Date().toISOString()
    };

    try {
        amqpChannel.publish(
            NOTIFICATION_EXCHANGE,
            '', 
            Buffer.from(JSON.stringify(message)),
            { persistent: true } 
        );
        console.log(`[EVENT PUBLISHED] ${eventType} | Email: ${email} | Phone: ${phone}`);
        return true;
    } catch (error) {
        console.error(`[PUBLISH ERROR] Không thể gửi message: ${error.message}`);
        return false;
    }
}