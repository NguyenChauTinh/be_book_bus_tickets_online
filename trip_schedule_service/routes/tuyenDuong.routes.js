import { Router } from "express";
import {
  createTuyenDuong,
  getTuyenDuong,
  updateTuyenDuong,
  deleteTuyenDuong,
  listTuyenDuong,
  deleteChiTietTuyenDuong,
  toggleActiveTuyenDuong,
  getDiaDiemKetNoi,
} from "../controllers/tuyenDuong.controller.js";

const router = Router();

// Tuyến đường
router.post("/tao-tuyen-duong", createTuyenDuong);
router.get("/lay-tuyen-duong/:id", getTuyenDuong);
router.put("/cap-nhat-tuyen-duong/:id", updateTuyenDuong);
router.delete("/xoa-tuyen-duong/:id", deleteTuyenDuong);
router.get("/danh-sach-tuyen-duong", listTuyenDuong);
router.delete("/xoa-chi-tiet-tuyen-duong/:id", deleteChiTietTuyenDuong);
router.patch("/thay-doi-trang-thai-tuyen-duong/:id", toggleActiveTuyenDuong);
router.get("/lay-dia-diem-ket-noi", getDiaDiemKetNoi);

export default router;
