import { Router } from "express";
import {
  createTuyenDuong,
  getTuyenDuong,
  updateTuyenDuong,
  deleteTuyenDuong,
  listTuyenDuong,
} from "../controllers/tuyenDuong.controller.js";

const router = Router();

// Tuyến đường
router.post("/tao-tuyen-duong", createTuyenDuong);
router.get("/lay-tuyen-duong/:id", getTuyenDuong);
router.put("/cap-nhat-tuyen-duong/:id", updateTuyenDuong);
router.delete("/xoa-tuyen-duong/:id", deleteTuyenDuong);
router.get("/danh-sach-tuyen-duong", listTuyenDuong);

export default router;
