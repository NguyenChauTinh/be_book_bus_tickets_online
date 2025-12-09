import express from 'express';
import {
    dangKy,
    dangNhap,
    chinhSuaTaiKhoan,
    timTaiKhoan,
    layDanhSachTaiKhoan,
    layDanhSachTaiKhoanPhongVe,
    refreshToken,
    doiMatKhau
} from '../controllers/taiKhoan.controller.js';

const taiKhoanRouter = express.Router();

taiKhoanRouter.post('/dang-ky', dangKy);
taiKhoanRouter.post('/dang-nhap', dangNhap);
taiKhoanRouter.post('/refresh-token', refreshToken);
taiKhoanRouter.get('/danh-sach', layDanhSachTaiKhoan);
taiKhoanRouter.get('/danh-sach/phong-ve', layDanhSachTaiKhoanPhongVe);
taiKhoanRouter.get('/tim-kiem/:id', timTaiKhoan);
taiKhoanRouter.put('/chinh-sua/:id', chinhSuaTaiKhoan);
taiKhoanRouter.put('/doi-mat-khau/:id', doiMatKhau)

export default taiKhoanRouter;