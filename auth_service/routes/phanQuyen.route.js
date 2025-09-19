import express from 'express';
import {
    taoQuyen,
    layDanhSachPhanQuyen,
    layChiTietPhanQuyen,
    capNhatQuyen,
} from '../controllers/phanQuyen.controller.js';

const phanQuyenRouter = express.Router();

phanQuyenRouter.route('/')
    .post(taoQuyen)
    .get(layDanhSachPhanQuyen);

phanQuyenRouter.route('/:id')
    .get(layChiTietPhanQuyen)
    .put(capNhatQuyen);

export default phanQuyenRouter;