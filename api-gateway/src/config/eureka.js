import { Eureka } from 'eureka-js-client';
import env from './env.js';

const client = new Eureka({
    instance: {
        app: 'API-GATEWAY',
        hostName: 'localhost',
        ipAddr: '127.0.0.1',
        statusPageUrl: `http://localhost:${env.PORT}/info`,
        port: {
            '$': env.PORT,
            '@enabled': 'true',
        },
        vipAddress: 'api-gateway',
        dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name: 'MyOwn',
        },
    },
    eureka: {
        host: env.EUREKA.host,
        port: env.EUREKA.port,
        servicePath: env.EUREKA.servicePath,
    },
});

export const connectEureka = () => {
    client.start((error) => {
        if (error) console.error('Eureka registration failed:', error);
        else console.log('Eureka registration successful!');
    });
};

export const eurekaClient = client;