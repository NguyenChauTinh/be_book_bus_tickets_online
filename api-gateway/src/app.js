import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import setupProxies from './middlewares/proxy.middleware.js';
import authMiddleware from './middlewares/auth.middleware.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));

app.get('/info', (req, res) => {
    res.json({ 
        status: 'UP', 
        name: 'API-GATEWAY', 
        timestamp: new Date() 
    });
});
app.use(authMiddleware);
setupProxies(app);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'API Route Not Found on Gateway' });
});

export default app;