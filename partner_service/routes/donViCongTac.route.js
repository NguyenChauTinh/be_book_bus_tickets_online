// routes/donViCongTacRoutes.js
import express from 'express';
import { 
    getAllDonViCongTac,
    getDonViCongTacById,
    createDonViCongTac,
    updateDonViCongTac,
    deactivateDonViCongTac,
    activateDonViCongTac
} from '../controllers/donViCongTac.controller.js';

const DonViCongTacRouter = express.Router();


DonViCongTacRouter.get('/', getAllDonViCongTac);

DonViCongTacRouter.get('/:id', getDonViCongTacById);

DonViCongTacRouter.post('/', createDonViCongTac);

DonViCongTacRouter.put('/:id', updateDonViCongTac);

DonViCongTacRouter.put('/deactivate/:id', deactivateDonViCongTac);  

DonViCongTacRouter.put('/activate/:id', activateDonViCongTac);

export default DonViCongTacRouter;