import jwt from "jsonwebtoken";
import env from "../config/env.js";
import redisClient from "../config/redis.js";



const authMiddleware = async (req, res, next) => {
    console.log("req.path === ", req.path);

  if (req.method == "OPTIONS" || 
        req.path == "/" || 
        req.path == "/info" || 
        req.path == "/health" ||
        req.path.startsWith("/favicon.ico") ||
        req.path.startsWith("/socket.io")) 
    {
        return next();
    }
  
  const publicPaths = [
  "/api/v1/tai-khoan/dang-nhap",
  "/api/v1/tai-khoan/dang-ky",
  "/api/v1/tai-khoan/refresh-token",
  "/api/v1/tai-khoan-khach-hang/register/request-otp",
  "/api/v1/tai-khoan-khach-hang/login/request-otp",
  "/api/v1/tai-khoan-khach-hang/login/verify",
  "/api/v1/tai-khoan-khach-hang/register/complete",
  "/api/v1/tai-khoan-khach-hang/login/complete",
  "/api/v1/tai-khoan-khach-hang/refresh-token",
  "/api/v1/payment/vnpay_return",
  "/api/v1/payment/vnpay_ipn",
  "/api/v1/chat",
];
  const isPublic = publicPaths.some((path) => req.path.startsWith(path));
  if (isPublic) {
    return next();
  }
  console.log("Protected Path - Checking Token");
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: No Token Provided or Invalid Format",
    });
  }
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Access Denied: No Token Provided" });
  }

  try {
    console.log("JWT on gateway === ", env.JWT_SECRET);
    const verified = jwt.verify(
      token,
      env.JWT_SECRET
    );

    const userId = verified.userId || verified.id;
    console.log("User id == ", userId);
    const sessionKey = `session:${userId}`;
    const sessionExists = await redisClient.get(sessionKey);
    
    if (!sessionExists) {
      return res.status(401).json({
        success: false,
        message: "Session expired or logged out. Please login again.",
      });
    }

    req.headers["x-user-id"] = userId;
    req.headers["x-user-role"] = verified.role || "user";
    req.headers["x-user-email"] = verified.email || "";

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token Expired" });
    }
    return res.status(403).json({ success: false, message: "Invalid Token" });
  }
};

export default authMiddleware;
