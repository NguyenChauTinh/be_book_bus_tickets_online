// payment.route.js
import express from 'express';
import { createPaymentUrl, vnpay_ipn, vnpay_return } from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/create_payment_url', createPaymentUrl);
router.get('/vnpay_ipn', vnpay_ipn);
router.get('/vnpay_return', vnpay_return);

export default router;