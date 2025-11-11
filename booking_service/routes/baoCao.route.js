import { Router } from "express";
import { getBaoCaoDoanhThuDaiLy, getBaoCaoDoanhThuNganHang, getBaoCaoDoanhThuNhanVien, getBaoCaoDoanhThuVanPhong } from "../controllers/baoCao.controller.js";

const baoCaoRouter = Router();

baoCaoRouter.post("/doanh-thu/van-phong", getBaoCaoDoanhThuVanPhong);
baoCaoRouter.post("/doanh-thu/nhan-vien", getBaoCaoDoanhThuNhanVien);
baoCaoRouter.post("/doanh-thu/dai-ly", getBaoCaoDoanhThuDaiLy);
baoCaoRouter.post("/doanh-thu/ngan-hang", getBaoCaoDoanhThuNganHang);

export default baoCaoRouter;