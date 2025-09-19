import express from 'express';
import {
    layDanhSachNhanVien,
    taoNhanVien,
    capNhatNhanVien,
    capNhatTrangThaiNhanVien,
    timNhanVienTheoMa,
} from '../controllers/nhanVien.controller.js';

const nhanVienRouter = express.Router();

nhanVienRouter.route('/')
    .get(layDanhSachNhanVien) 
    .post(taoNhanVien);


nhanVienRouter.route('/:id')
    .put(capNhatNhanVien) 
    .get(timNhanVienTheoMa); 


nhanVienRouter.route('/status/:id').put(capNhatTrangThaiNhanVien);

export default nhanVienRouter;