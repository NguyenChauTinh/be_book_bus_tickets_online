import { Router } from "express";
import {
  getAllGiaVe,
  getGiaVeById,
  createGiaVe,
  updateGiaVe,
  deleteGiaVe,
  toggleActiveStatus,
  addChiTietGiaVe,
  updateChiTietGiaVe,
  deleteChiTietGiaVe,
} from "../controllers/giaVe.controller.js";

const router = Router();

router.post("/tao-gia-ve", createGiaVe);

router.get("/danh-sach-gia-ve", getAllGiaVe);

router.get("/lay-gia-ve/:id", getGiaVeById);

router.put("/cap-nhat-gia-ve/:id", updateGiaVe);

router.patch("/vo-hieu-hoa-gia-ve/:id", deleteGiaVe); 

router.patch("/thay-doi-trang-thai-gia-ve/:id", toggleActiveStatus);

router.post("/:id/details", addChiTietGiaVe);

router.put("/:id/details/:chiTietId", updateChiTietGiaVe);

router.delete("/:id/details/:chiTietId", deleteChiTietGiaVe);


export default router;