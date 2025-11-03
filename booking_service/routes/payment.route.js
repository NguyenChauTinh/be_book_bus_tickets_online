// payment.route.js
import express from 'express';
import { checkPaymentStatus, createBookingAndPaymentUrl, createPaymentUrl, filterHoaDon, vnpay_ipn, vnpay_return } from '../controllers/payment.controller.js';

const paymentRouter = express.Router();

paymentRouter.post('/create_payment_url', createPaymentUrl);
paymentRouter.post('/create-booking-and-payment', createBookingAndPaymentUrl);
paymentRouter.get('/vnpay_ipn', vnpay_ipn);
paymentRouter.get('/vnpay_return', vnpay_return);
paymentRouter.get("/check-status", checkPaymentStatus);
paymentRouter.get('/filter', filterHoaDon);
export default paymentRouter;