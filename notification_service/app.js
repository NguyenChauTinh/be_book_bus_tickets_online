import express from 'express';
import { setupConsumer } from './notification_consumer.js';
import { PORT } from './config/env.js';

const app = express();
let currentQueue = 'N/A';

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