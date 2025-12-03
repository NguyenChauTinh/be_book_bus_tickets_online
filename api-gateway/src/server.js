import app from './app.js';
import env from './config/env.js';
import { connectEureka, eurekaClient } from './config/eureka.js';

app.listen(env.PORT, () => {
    console.log(`API GATEWAY is running on port: ${env.PORT}`);
    console.log(`Health check: http://localhost:${env.PORT}/info`);
    
    connectEureka();
});

process.on('SIGINT', () => {
    console.log('Shutting down Gateway...');
    eurekaClient.stop(() => {
        console.log('Deregistered from Eureka.');
        process.exit();
    });
});