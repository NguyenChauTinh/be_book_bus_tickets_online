import { Router } from "express";
import {
  createDiaDiem,
  getAllDiaDiem,
  getDiaDiemById,
  updateDiaDiem,
  deleteDiaDiem,
} from "../controllers/diaDiem.controller.js";

const router = Router();
// Địa điểm
router.post("/tao-dia-diem", createDiaDiem);
router.get("/lay-tat-ca-dia-diem", getAllDiaDiem);
router.get("/lay-dia-diem/:id", getDiaDiemById);
router.put("/cap-nhat-dia-diem/:id", updateDiaDiem);
router.delete("/xoa-dia-diem/:id", deleteDiaDiem);

export default router;
