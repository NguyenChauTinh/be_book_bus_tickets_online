import amqp from 'amqplib';

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
export function publishEvent(eventType, payload) {
    if (!amqpChannel) {
        console.error("Lỗi: Không có kết nối RabbitMQ. Không thể gửi sự kiện.");
        return false;
    }

    const message = {
        type: eventType,
        ...payload,
        timestamp: new Date().toISOString()
    };

    amqpChannel.publish(
        NOTIFICATION_EXCHANGE,
        '', 
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
    );
    console.log(`[EVENT PUBLISHED] Loại: ${eventType} | Dữ liệu vé đã được gửi đến RabbitMQ.`);
    return true;
}