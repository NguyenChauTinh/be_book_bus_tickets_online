import express from 'express';
import * as xeController from '../controllers/xe.controller.js';

const xeRouter = express.Router();

xeRouter.get('/', xeController.layDanhSachXe);

xeRouter.get('/:id', xeController.layXeTheoId);

xeRouter.post('/', xeController.taoXe);

xeRouter.put('/:id', xeController.capNhatXe);

xeRouter.put('/status/:id', xeController.capNhatTrangThaiXe);

export default xeRouter;