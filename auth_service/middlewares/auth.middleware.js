
const authMiddleware = (req, res, next) => {
  const gatewayUserId = req.headers['x-user-id'];

  if (!gatewayUserId) {
    return res.status(403).json({ 
      message: 'Truy cập bị từ chối. Request phải đi qua API Gateway.' 
    });
  }

  req.user = {
    id: gatewayUserId,
    role: req.headers['x-user-role'],
    email: req.headers['x-user-email']
  };

  next();
};

export default authMiddleware;