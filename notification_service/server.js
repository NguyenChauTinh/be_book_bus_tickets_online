import express from 'express';
import { setupConsumer } from './notification_consumer.js';
import { PORT } from './config/env.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
let currentQueue = 'N/A';
app.use((req, res, next) => {
    console.log(`[DEBUG AUTH] URL Nhận được: ${req.url}`);
    next();
});
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'API Gateway is Healthy' });
});
async function startServer() {
    const consumerInfo = await setupConsumer();
    if (consumerInfo && consumerInfo.queue) {
        currentQueue = consumerInfo.queue;
    }

    app.get('/health', (req, res) => {
        res.status(200).json({ 
            status: 'OK', 
            service: 'Notification Service',
            queue_listening: currentQueue
        });
    });

    app.listen(PORT, () => {
        console.log(`Express server đang chạy trên cổng ${PORT}`);
        console.log(`Notification Service đã sẵn sàng!`);
    });
}


startServer();