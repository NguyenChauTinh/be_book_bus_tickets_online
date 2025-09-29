import { Router } from "express";
import {
  createLichChayMoi,
  getDanhSachLichChay,
  updateLichChay,
  updateTrangThaiLichChay,
  updateTrangThaiLine
} from "../controllers/lichChay.controller.js";

const lichChayRouter = Router();

// Lịch chạy
lichChayRouter.get("/", getDanhSachLichChay);
lichChayRouter.post("/", createLichChayMoi);
lichChayRouter.put("/:id", updateLichChay);
lichChayRouter.patch("/status/:id", updateTrangThaiLichChay);
lichChayRouter.patch('/update-line-status/:lichChayId/:maLine', updateTrangThaiLine);
// lichChayRouter.put('/:maLichChay/lines/:maLine', updateLichChayLine); 
export default lichChayRouter;
