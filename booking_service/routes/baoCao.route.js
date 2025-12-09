import { Router } from "express";
import { getBaoCaoDoanhThuDaiLy, getBaoCaoDoanhThuNganHang, getBaoCaoDoanhThuNhanVien, getBaoCaoDoanhThuVanPhong, getCustomerStatsByPhone, getCustomerStatsByUserId } from "../controllers/baoCao.controller.js";

const baoCaoRouter = Router();

baoCaoRouter.post("/doanh-thu/van-phong", getBaoCaoDoanhThuVanPhong);
baoCaoRouter.post("/doanh-thu/nhan-vien", getBaoCaoDoanhThuNhanVien);
baoCaoRouter.post("/doanh-thu/dai-ly", getBaoCaoDoanhThuDaiLy);
baoCaoRouter.post("/doanh-thu/ngan-hang", getBaoCaoDoanhThuNganHang);
baoCaoRouter.post("/khach-hang/user-id", getCustomerStatsByUserId);
baoCaoRouter.post("/khach-hang/sdt", getCustomerStatsByPhone);

export default baoCaoRouter;