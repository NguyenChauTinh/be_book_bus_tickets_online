import express from "express";
import {
  getDanhSachChuyenXe,
  getChuyenXeByID,
  updateTrangThaiChuyenXe,
  createChuyenXeDonLe,
  updateChuyenXe,
  getDanhSachChuyenXeTheoNgay,
  getDanhSachChuyenXeTheoNgayVaDiaDiem,
  getDanhSachChuyenXeFilter,
  getChuyenXeByObjId,
  getMultipleChuyenXeByIds,
  getChuyenXeTheoKhoangNgay,
} from "../controllers/chuyenXe.controller.js";

const chuyenXeRouter = express.Router();

chuyenXeRouter.get("/", getDanhSachChuyenXe);
chuyenXeRouter.get("/theo-ngay", getDanhSachChuyenXeTheoNgay);
chuyenXeRouter.get("/theo-khoang-ngay", getChuyenXeTheoKhoangNgay);
chuyenXeRouter.get(
  "/theo-ngay-va-dia-diem",
  getDanhSachChuyenXeTheoNgayVaDiaDiem
);
chuyenXeRouter.get("/filter-list", getDanhSachChuyenXeFilter);
chuyenXeRouter.get("/:id", getChuyenXeByID);
chuyenXeRouter.post("/", createChuyenXeDonLe);
chuyenXeRouter.put("/:id", updateChuyenXe);
chuyenXeRouter.patch("/status/:id", updateTrangThaiChuyenXe);
chuyenXeRouter.get("/by-obj-id/:id", getChuyenXeByObjId);
chuyenXeRouter.post("/get-by-ids", getMultipleChuyenXeByIds);
export default chuyenXeRouter;
