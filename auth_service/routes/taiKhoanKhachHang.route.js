import express from "express";
import * as authController from "../controllers/taiKhoanKhachHang.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const taiKhoanKHRouter = express.Router();

taiKhoanKHRouter.post(
  "/register/request-otp",
  authController.requestRegisterOtp
);
taiKhoanKHRouter.post(
  "/register/complete",
  authController.completeRegistration
);

taiKhoanKHRouter.post("/login/request-otp", authController.requestLoginOtp);
taiKhoanKHRouter.post("/login/verify", authController.verifyLoginOtp);
taiKhoanKHRouter.post("/xoa-lich-su", authController.clearSearchHistory);
taiKhoanKHRouter.post("/check/request-otp", authController.requestOtp);
taiKhoanKHRouter.post("/check/verify", authController.verifyOtp);
taiKhoanKHRouter.post("/check/request-otp-cus", authController.requestOtpCus);
taiKhoanKHRouter.post("/check/verify-cus", authController.verifyOtpCus);

taiKhoanKHRouter.post("/logout", authMiddleware, authController.logout);
taiKhoanKHRouter.get(
  "/recent-searches",
  authMiddleware,
  authController.getRecentSearches
);
taiKhoanKHRouter.post("/profiles/batch", authController.getProfilesByIds);
export default taiKhoanKHRouter;
