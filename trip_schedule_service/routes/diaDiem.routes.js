import { Router } from "express";
import {
  createDiaDiem,
  getAllDiaDiem,
  getDiaDiemById,
  updateDiaDiem,
  deleteDiaDiem,
  toggleActiveDiaDiem,
  getActiveDiaDiem,
  timDiaDiemTheoTen,
} from "../controllers/diadiem.controller.js";

const router = Router();
// Địa điểm
router.post("/tao-dia-diem", createDiaDiem);
router.get("/lay-tat-ca-dia-diem", getAllDiaDiem);
router.get("/lay-dia-diem/:id", getDiaDiemById);
router.put("/cap-nhat-dia-diem/:id", updateDiaDiem);
router.delete("/xoa-dia-diem/:id", deleteDiaDiem);
router.patch("/toggle-active-dia-diem/:id", toggleActiveDiaDiem);
router.get("/lay-dia-diem-active", getActiveDiaDiem);
router.get("/tim-dia-diem-theo-ten", timDiaDiemTheoTen);

export default router;
