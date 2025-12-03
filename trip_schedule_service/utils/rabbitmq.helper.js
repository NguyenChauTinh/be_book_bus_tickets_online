import amqp from 'amqplib';
import { RABBITMQ_URL, HISTORY_SEARCH_EXCHANGE, UPDATE_SEAT_EXCHANGE,  TRIP_SERVICE_ROUTING_KEY, HISTORY_SEARCH_ROUTING_KEY, TRIP_SERVICE_QUEUE} from '../config/env.js';
import ChuyenXe from '../models/chuyenXe.model.js';
export let amqpChannel = null;
export async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        amqpChannel = await connection.createChannel();
        
        await amqpChannel.assertExchange(HISTORY_SEARCH_EXCHANGE, 'direct', { durable: true });

        await amqpChannel.assertExchange(UPDATE_SEAT_EXCHANGE, 'direct', { durable: true });

        const q = await amqpChannel.assertQueue(TRIP_SERVICE_QUEUE, { durable: true });

        await amqpChannel.bindQueue(q.queue, UPDATE_SEAT_EXCHANGE, TRIP_SERVICE_ROUTING_KEY);
        amqpChannel.consume(q.queue, processInternalCommand, {
            noAck: false 
        });
        console.log("Trip Schedule Service đã kết nối RabbitMQ và khai báo Exchange.");
    } catch (error) {
        console.error("LỖI KẾT NỐI RABBITMQ (Producer):", error.message);
        amqpChannel = null; 
    }
}
export function publishSearchHistoryEvent(userId, searchDetails) {
    if (!amqpChannel) {
        console.error("Lỗi: Không có kết nối RabbitMQ. Không thể gửi sự kiện lịch sử tìm kiếm.");
        return false;
    }

    const message = {
        userId: userId, 
        diemDiId: searchDetails.diemDiId,
        diemDenId: searchDetails.diemDenId,
        tenDiemDi: searchDetails.tenDiemDi,
        tenDiemDen: searchDetails.tenDiemDen,
        ngayKhoiHanh: searchDetails.ngayKhoiHanh,
        timestamp: new Date().toISOString()
    };

    
    amqpChannel.publish(
        HISTORY_SEARCH_EXCHANGE,
        HISTORY_SEARCH_ROUTING_KEY, 
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
    );
    
    console.log(`[EVENT PUBLISHED] Loại: LỊCH SỬ TÌM KIẾM | Dữ liệu đã được gửi đến RabbitMQ.`);
    return true;
}
const processInternalCommand = async (msg) => {
    if (!msg) return;
    
    try {
        const command = JSON.parse(msg.content.toString());
        console.log(`[RECEIVED COMMAND] Type: ${command.commandType} | Chuyến: ${command.chuyenXeId}`);

        if (command.commandType === "UPDATE_SEATS") {
            const { chuyenXeId, changeAmount } = command;

            const updatedTrip = await ChuyenXe.findByIdAndUpdate(
                chuyenXeId,
                { $inc: { soLuongVe: (changeAmount) } },
                { new: true }
            );

            if (updatedTrip) {
                if (updatedTrip.soLuongVe < 0) {
                    updatedTrip.soLuongVe = 0;
                    await updatedTrip.save();
                    console.warn(`[CẢNH BÁO] Số lượng vé trên chuyến ${chuyenXeId} bị âm, đã reset về 0.`);
                }
                console.log(`[SUCCESS] Đã cập nhật soLuongVe cho chuyến ${chuyenXeId}: ${updatedTrip.soLuongVe}`);
            } else {
                console.warn(`[FAILED] Không tìm thấy Chuyến xe ID: ${chuyenXeId} để cập nhật ghế.`);
            }
        }
        
        amqpChannel.ack(msg); 
    } catch (error) {
        console.error("LỖI XỬ LÝ INTERNAL COMMAND:", error.message);
        amqpChannel.nack(msg); 
    }
};