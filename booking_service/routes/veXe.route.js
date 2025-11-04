import express from 'express';
import {
    createTicket,
    getTicketsByChuyenXeId,
    getTicketById,
    searchTickets,
    addDetailToTicket,
    updateMultipleTicketDetails,
    cancelMultipleTicketDetails,
    unifiedTransferOrSwapDetails,
    getTicketCountsForMultipleTrips,
    getCancelledTicketsByChuyenXeId,
    createManualInvoice,
    getTicketsByChuyenXeList,
    filterVeXeMaster,
} from '../controllers/veXe.controller.js';

const veXeRouter = express.Router();

veXeRouter.post('/', createTicket);
veXeRouter.get('/tim-kiem', searchTickets);
veXeRouter.post('/filter-by-chuyen', filterVeXeMaster);
veXeRouter.get('/chuyen-xe/:chuyenXeId', getTicketsByChuyenXeId);
veXeRouter.get('/:ticketId', getTicketById);
veXeRouter.post('/:ticketId/details', addDetailToTicket);
veXeRouter.put('/:ticketId/details', updateMultipleTicketDetails);
veXeRouter.post('/:ticketId/manual-invoice', createManualInvoice);
veXeRouter.post('/:ticketId/details/batch-cancel', cancelMultipleTicketDetails);
veXeRouter.put('/details/unified-transfer-swap', unifiedTransferOrSwapDetails);
veXeRouter.post('/thong-ke/so-luong-theo-chuyen', getTicketCountsForMultipleTrips);
veXeRouter.get('/chuyen-xe/:chuyenXeId/da-huy', getCancelledTicketsByChuyenXeId);
export default veXeRouter;