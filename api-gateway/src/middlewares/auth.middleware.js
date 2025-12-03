import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import redisClient from '../config/redis.js';

const publicPaths = [
    '/api/v1/tai-khoan/dang-nhap',
    '/api/v1/tai-khoan/dang-ky',
    '/api/v1/tai-khoan/refresh-token',
    '/api/v1/tai-khoan-khach-hang/register/request-otp', 
    '/api/v1/tai-khoan-khach-hang/login/request-otp',
    '/api/v1/tai-khoan-khach-hang/login/verify',
    '/api/v1/tai-khoan-khach-hang/register/complete',
    '/api/v1/tai-khoan-khach-hang/login/complete',
    '/api/v1/tai-khoan-khach-hang/refresh-token',
    '/info',
    '/socket.io/',
    '/health',
    '/api/v1/chat'
];

const authMiddleware = async (req, res, next) => {
    const isPublic = publicPaths.some(path => req.path.startsWith(path));
    if (isPublic) {
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access Denied: No Token Provided' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || env.JWT_SECRET); 
        
        const userId = verified.userId || verified.id;

        const sessionKey = `session:${userId}`;
        const sessionExists = await redisClient.get(sessionKey);

        if (!sessionExists) {
            return res.status(401).json({ 
                success: false, 
                message: 'Session expired or logged out. Please login again.' 
            });
        }

        req.headers['x-user-id'] = userId;
        req.headers['x-user-role'] = verified.role || 'user';
        req.headers['x-user-email'] = verified.email || '';

        next(); 
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token Expired' });
        }
        return res.status(403).json({ success: false, message: 'Invalid Token' });
    }
};

export default authMiddleware;