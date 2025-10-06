import express from 'express';
import {
    getTicketsByChuyenXeId,
    createTicket,
    updateTicketDetails,
    updateTicketDetailStatus,
    searchTickets,
} from '../controllers/veXe.controller.js';

const router = express.Router();

router.get('/chuyen-xe/:chuyenXeId', getTicketsByChuyenXeId);

router.post('/', createTicket);

router.put('/:ticketId/details', updateTicketDetails);

router.patch('/:ticketId/chi-tiet/:chiTietId/trang-thai', updateTicketDetailStatus);

router.get('/tim-kiem', searchTickets);

export default router;