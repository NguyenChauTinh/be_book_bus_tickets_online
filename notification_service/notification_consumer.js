// --- Các thư viện cần thiết ---
import amqp from 'amqplib';
import nodemailer from 'nodemailer';
import { RABBITMQ_URL, NOTIFICATION_EXCHANGE, NOTIFICATION_QUEUE, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } from './config/env.js';
import { getBookingSuccessTemplate, getRegistrationSuccessTemplate } from './utils/email-template.js';
const emailTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, 
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});


async function sendEmail(to, subject, htmlContent) {
    try {
        const info = await emailTransporter.sendMail({
            from: `Thông báo từ SmartBus`,
            to: to,
            subject: subject,
            html: htmlContent, 
        });
    } catch (error) {
        console.error(`[EMAIL FAILED] Không thể gửi email đến ${to}:`, error.message);
    }
}

function sendNotification(notificationData) {
    const { userId, type, email, phone, payload } = notificationData;

    console.log(`Loại sự kiện: ${type}`);
    console.log(`Người dùng: ${userId}`);

    let subject = '';
    let emailBody = '';
    
    // --- 1. Tạo nội dung Email dựa trên loại sự kiện (type) ---
    if (type === 'TICKET_BOOKED_SUCCESSFULLY') {
        subject = `[Xác nhận] Vé xe #${payload.bookingId} đã được đặt thành công`;
        emailBody = getBookingSuccessTemplate({ 
            ...payload, 
            userName: payload.userName || 'Khách hàng',
            totalPrice: payload.totalPrice || 0,
            seats: payload.seats || [],
            departureDate: payload.tripDetails.departureTime ? new Date(payload.tripDetails.departureTime).toLocaleDateString('vi-VN') : 'N/A',
            tripDetails: {
                route: payload.tripDetails.route || 'N/A',
                departureTime: payload.tripDetails.departureTime ? new Date(payload.tripDetails.departureTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'
            }
        });

    } else if (type === 'USER_REGISTERED') {
        subject = `Chào mừng bạn đến với hệ thống Đặt vé xe!`;
        emailBody = getRegistrationSuccessTemplate({ userName: payload.userName || 'Bạn', email });
    } else {
        console.warn(`   -> [EVENT UNKNOWN] Bỏ qua sự kiện không xác định: ${type}`);
        return;
    }

    // --- 2. Gửi Email ---
    if (email && emailBody) {
        sendEmail(email, subject, emailBody);
    } else if (email) {
        console.warn(`   -> [EMAIL SKIP] Bỏ qua gửi Email vì thiếu template.`);
    }

    // --- 3. Logic gửi SMS (Giả lập) ---
    if (phone && payload.smsBody) {
        console.log(`   -> [SMS SENT MOCK] Gửi SMS đến ${phone} | Nội dung: ${payload.smsBody}`);
    } else if (phone) {
        console.warn(`   -> [SMS SKIP] Bỏ qua gửi SMS vì thiếu nội dung.`);
    }

    console.log(`--- Xử lý hoàn tất ---`);
}


export async function setupConsumer() {
    let connection;
    try {
        //1. Kết nối tới RabbitMQ
        connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        //2. Thiết lập Exchange và Queue
        await channel.assertExchange(NOTIFICATION_EXCHANGE, 'fanout', { durable: true });

        //3. Ràng buộc Queue với Exchange bằng binding key rỗng
        const q = await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });
        await channel.bindQueue(q.queue, NOTIFICATION_EXCHANGE, '');

        // 4. Thiết lập Consumer (Lắng nghe tin nhắn)
        channel.consume(q.queue, (msg) => {
            if (msg !== null) {
                try {
                    const messageContent = JSON.parse(msg.content.toString());
                    sendNotification(messageContent); 
                    channel.ack(msg); // Xác nhận đã xử lý thành công
                } catch (error) {
                    console.error("Lỗi khi xử lý tin nhắn:", error.message);
                    channel.nack(msg); // Trả lại tin nhắn nếu xử lý lỗi
                }
            }
        }, {
            noAck: false
        });

        console.log("Notification Consumer đang lắng nghe tin nhắn. Đã sẵn sàng.");
        return { queue: NOTIFICATION_QUEUE };

    } catch (error) {
        console.error("LỖI KHỞI TẠO RABBITMQ. Vui lòng kiểm tra Docker container:", error.message);
        process.exit(1);
    }
}