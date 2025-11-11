import express from 'express';
import {
    dangKy,
    dangNhap,
    chinhSuaTaiKhoan,
    timTaiKhoan,
    layDanhSachTaiKhoan,
    layDanhSachTaiKhoanPhongVe
} from '../controllers/taiKhoan.controller.js';


const taiKhoanRouter = express.Router();


taiKhoanRouter.post('/dang-ky', dangKy);


taiKhoanRouter.post('/dang-nhap', dangNhap);


taiKhoanRouter.put('/:id', chinhSuaTaiKhoan);


taiKhoanRouter.get('/danh-sach', layDanhSachTaiKhoan);

taiKhoanRouter.get('/:id', timTaiKhoan);

taiKhoanRouter.get('/danh-sach/phong-ve', layDanhSachTaiKhoanPhongVe);

export default taiKhoanRouter;