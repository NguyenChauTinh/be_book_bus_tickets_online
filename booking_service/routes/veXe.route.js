import express from "express";
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
  getTicketsByUserId,
  printMultipleTickets,
  checkActiveTickets
} from "../controllers/veXe.controller.js";

const veXeRouter = express.Router();

veXeRouter.post("/", createTicket);
veXeRouter.get("/tim-kiem", searchTickets);
veXeRouter.post("/check-active-tickets", checkActiveTickets);
veXeRouter.post("/in-ve", printMultipleTickets);
veXeRouter.post("/filter-by-chuyen", filterVeXeMaster);
veXeRouter.get("/chuyen-xe/:chuyenXeId", getTicketsByChuyenXeId);
veXeRouter.get("/user/:userId", getTicketsByUserId);
veXeRouter.post(
  "/thong-ke/so-luong-theo-chuyen",
  getTicketCountsForMultipleTrips
);

veXeRouter.get(
  "/chuyen-xe/:chuyenXeId/da-huy",
  getCancelledTicketsByChuyenXeId
);
veXeRouter.get("/:ticketId", getTicketById);
veXeRouter.post("/:ticketId/details", addDetailToTicket);
veXeRouter.put("/:ticketId/details", updateMultipleTicketDetails);
veXeRouter.post("/:ticketId/manual-invoice", createManualInvoice);
veXeRouter.post("/:ticketId/details/batch-cancel", cancelMultipleTicketDetails);
veXeRouter.put("/details/unified-transfer-swap", unifiedTransferOrSwapDetails);

export default veXeRouter;
