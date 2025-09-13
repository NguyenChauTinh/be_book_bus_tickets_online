import { Router } from "express";
import { createDiaDiem } from "../controllers/diaDiem.controller.js";

const diaDiemRouter = Router();
diaDiemRouter.post("/create-dia-diem", createDiaDiem);

export default diaDiemRouter;
