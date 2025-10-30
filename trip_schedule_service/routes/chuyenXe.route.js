import express from "express";
import {
  getDanhSachChuyenXe,
  getChuyenXeByID,
  updateTrangThaiChuyenXe,
  createChuyenXeDonLe,
  updateChuyenXe,
  getDanhSachChuyenXeTheoNgay,
  getDanhSachChuyenXeTheoNgayVaDiaDiem,
} from "../controllers/chuyenXe.controller.js";

const chuyenXeRouter = express.Router();

chuyenXeRouter.get("/", getDanhSachChuyenXe);
chuyenXeRouter.get("/theo-ngay", getDanhSachChuyenXeTheoNgay);
chuyenXeRouter.get(
  "/theo-ngay-va-dia-diem",
  getDanhSachChuyenXeTheoNgayVaDiaDiem
);
chuyenXeRouter.get("/:id", getChuyenXeByID);
chuyenXeRouter.post("/", createChuyenXeDonLe);
chuyenXeRouter.put("/:id", updateChuyenXe);
chuyenXeRouter.patch("/status/:id", updateTrangThaiChuyenXe);

export default chuyenXeRouter;
