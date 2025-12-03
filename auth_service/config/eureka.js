import { Eureka } from 'eureka-js-client';
import dotenv from 'dotenv';
import { PORT, SERVICE_NAME, EUREKA_HOST, EUREKA_PORT } from './env.js';
dotenv.config();


const client = new Eureka({
    instance: {
        app: SERVICE_NAME, 
        hostName: 'localhost',
        ipAddr: '127.0.0.1',
        statusPageUrl: `http://localhost:${PORT}/info`, 
        healthCheckUrl: `http://localhost:${PORT}/health`,
        port: {
            '$': Number(PORT),
            '@enabled': 'true',
        },
        vipAddress: SERVICE_NAME.toLowerCase(), 
        dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name: 'MyOwn',
        },
    },
    eureka: {
        host: EUREKA_HOST,
        port: EUREKA_PORT,
        servicePath: '/eureka/apps/',
        maxRetries: 10,
        requestRetryDelay: 2000,
    },
});

export const connectToEureka = () => {
    client.start((error) => {
        if (error) {
            console.error(`[Eureka] ${SERVICE_NAME} register failed:`, error);
        } else {
            console.log(`[Eureka] ${SERVICE_NAME} registered successfully on port ${PORT}`);
        }
    });
};

export const disconnectEureka = () => {
    client.stop(() => {
        console.log(`[Eureka] ${SERVICE_NAME} deregistered.`);
    });
};