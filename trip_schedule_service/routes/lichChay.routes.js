import { Router } from "express";
import {
  createLichChay,
  getLichChay,
  updateLichChay,
  deleteLichChay,
  toggleActiveLichChay,
} from "../controllers/lichChay.controller.js";

const router = Router();

// Lịch chạy
router.post("/tao-lich-chay", createLichChay);
router.get("/lay-lich-chay/:id", getLichChay);
router.put("/cap-nhat-lich-chay/:id", updateLichChay);
router.delete("/xoa-lich-chay/:id", deleteLichChay);
router.patch("/chuyen-trang-thai-lich-chay/:id", toggleActiveLichChay);

export default router;
