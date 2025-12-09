import app from './app.js';
import env from './config/env.js';

app.listen(env.PORT, () => {
    console.log(`API GATEWAY is running on port: ${env.PORT}`);
    console.log(`Health check: http://localhost:${env.PORT}/info`);
    
});
