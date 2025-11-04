import jwt from 'jsonwebtoken';
import redisClient from '../config/redis.js'; 

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ message: 'Truy cập bị từ chối. Không tìm thấy token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const sessionKey = `session:${userId}`;
    const sessionExists = await redisClient.get(sessionKey);

    if (!sessionExists) {
      return res
        .status(401)
        .json({ message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' });
    }

    req.user = { id: userId };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token đã hết hạn.' });
    }
    return res.status(401).json({ message: 'Token không hợp lệ.' });
  }
};

export default authMiddleware;