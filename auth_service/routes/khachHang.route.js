import express from 'express';
import * as khachHangController from '../controllers/khachHang.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const khachHangRouter = express.Router();

// Áp dụng middleware cho tất cả route bên dưới
// router.use(authMiddleware);

khachHangRouter.get('/profile/me', khachHangController.getMyProfile);
khachHangRouter.put('/profile/me', khachHangController.updateMyProfile);

export default khachHangRouter;