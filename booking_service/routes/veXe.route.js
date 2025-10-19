import express from 'express';
import {
    createTicket,
    getTicketsByChuyenXeId,
    getTicketById,
    searchTickets,
    addDetailToTicket,
    updateMultipleTicketDetails,
    recordPayment,
    cancelMultipleTicketDetails,
    unifiedTransferOrSwapDetails,
} from '../controllers/veXe.controller.js';

const veXeRouter = express.Router();

// === CÁC ROUTE VỀ VÉ MASTER ===
veXeRouter.post('/', createTicket);
veXeRouter.get('/tim-kiem', searchTickets);
veXeRouter.get('/chuyen-xe/:chuyenXeId', getTicketsByChuyenXeId);
veXeRouter.get('/:ticketId', getTicketById);

// === CÁC ROUTE THAO TÁC TRÊN CHI TIẾT VÉ (SUB-DOCUMENTS) ===

// Thêm một hoặc nhiều chi tiết vé vào vé master đã có
veXeRouter.post('/:ticketId/details', addDetailToTicket);

// Cập nhật thông tin cho NHIỀU chi tiết vé cùng lúc
veXeRouter.put('/:ticketId/details', updateMultipleTicketDetails);

// === CÁC ROUTE NGHIỆP VỤ ĐẶC BIỆT ===

// Ghi nhận thanh toán
veXeRouter.post('/:ticketId/payments', recordPayment);

// Hủy MỘT chi tiết vé
veXeRouter.post('/:ticketId/details/batch-cancel', cancelMultipleTicketDetails);

// Di chuyển / hoán đổi vé hàng loạt
veXeRouter.put('/details/unified-transfer-swap', unifiedTransferOrSwapDetails);

export default veXeRouter;