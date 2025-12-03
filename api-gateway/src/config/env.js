// src/config/env.js
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const env = {
    PORT: process.env.PORT || 3000, 
    EUREKA: {
        host: process.env.EUREKA_HOST || 'localhost',
        port: Number(process.env.EUREKA_PORT) || 8761,
        servicePath: process.env.EUREKA_SERVICE_PATH || '/eureka/apps/',
    },
    SERVICES: {
        TRIP: process.env.URL_TRIP_SERVICE || 'http://localhost:3001',
        AUTH: process.env.URL_AUTH_SERVICE || 'http://localhost:3002', 
        NOTIFICATION: process.env.URL_NOTIFICATION_SERVICE || 'http://localhost:3003',
        PROMOTION: process.env.URL_PROMOTION_SERVICE || 'http://localhost:3004',
        BOOKING: process.env.URL_BOOKING_SERVICE || 'http://localhost:3005',
        AI: process.env.URL_AI_SERVICE || 'http://localhost:3006',
    },
    JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    
};

export default env;