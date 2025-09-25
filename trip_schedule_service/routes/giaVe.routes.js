import { Router } from "express";
import {
  getAllGiaVe,
  getGiaVeById,
  createGiaVe,
  updateGiaVe,
  deleteGiaVe,
} from "../controllers/giaVe.controller.js";

const router = Router();
router.post("/tao-gia-ve", createGiaVe);
router.get("/danh-sach-gia-ve", getAllGiaVe);
router.get("/lay-gia-ve/:id", getGiaVeById);
router.put("/cap-nhat-gia-ve/:id", updateGiaVe);
router.delete("/xoa-gia-ve/:id", deleteGiaVe);
export default router;
