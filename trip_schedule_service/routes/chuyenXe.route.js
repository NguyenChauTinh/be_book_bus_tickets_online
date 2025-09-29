import express from 'express';
import {
    getDanhSachChuyenXe,
    getChuyenXeByID,
    updateTrangThaiChuyenXe,
    createChuyenXeDonLe,
    updateChuyenXe, 
} from '../controllers/chuyenXe.controller.js';

const chuyenXeRouter = express.Router();

chuyenXeRouter.get('/', getDanhSachChuyenXe);
chuyenXeRouter.get('/:id', getChuyenXeByID);
chuyenXeRouter.post('/', createChuyenXeDonLe);
chuyenXeRouter.put('/:id', updateChuyenXe);
chuyenXeRouter.patch('/status/:id', updateTrangThaiChuyenXe);

export default chuyenXeRouter;