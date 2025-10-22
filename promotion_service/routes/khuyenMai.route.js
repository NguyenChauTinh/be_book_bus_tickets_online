import express from 'express';
import * as khuyenMaiController from '../controllers/khuyenMai.controller.js';

const khuyenMaiRouter = express.Router();

khuyenMaiRouter.get('/', khuyenMaiController.timKhuyenMai);

khuyenMaiRouter.get('/tim-ap-dung', khuyenMaiController.timKhuyenMaiApDung);

khuyenMaiRouter.get('/:id', khuyenMaiController.layKhuyenMaiTheoId);

khuyenMaiRouter.post('/', khuyenMaiController.taoKhuyenMai);

khuyenMaiRouter.put('/:id', khuyenMaiController.capNhatKhuyenMai);

khuyenMaiRouter.patch('/deactivate/:id', khuyenMaiController.voHieuHoaKhuyenMai);

khuyenMaiRouter.patch('/reactivate/:id', khuyenMaiController.khoiPhucKhuyenMai);

export default khuyenMaiRouter;