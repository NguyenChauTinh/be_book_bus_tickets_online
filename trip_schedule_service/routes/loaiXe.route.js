import express from 'express';
import { 
    createLoaiXe, 
    updateLoaiXe, 
    de_reactivateLoaiXe, 
    getAllLoaiXe 
} from '../controllers/loaiXe.controller.js';

const loaiXeRouter = express.Router();

loaiXeRouter.get('/', getAllLoaiXe);

loaiXeRouter.post('/', createLoaiXe);

loaiXeRouter.put('/:id', updateLoaiXe);

loaiXeRouter.patch('/:id', de_reactivateLoaiXe);

export default loaiXeRouter;