import express from 'express';
import {
  taoVaiTro,
  chinhSuaVaiTro,
  timVaiTro,
} from '../controllers/vaiTro.controller.js';

const vaiTrorouter = express.Router();

vaiTrorouter.route('/')
  .post(taoVaiTro) 
  .get(timVaiTro);      

vaiTrorouter.route('/:id')
  .put(chinhSuaVaiTro)
  .get(timVaiTro);  

vaiTrorouter.get('/', timVaiTro);

export default vaiTrorouter;