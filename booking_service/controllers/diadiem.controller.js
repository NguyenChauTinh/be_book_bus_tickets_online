import axios from "axios";
import { PORT } from "../config/env.js";

import diaDiem from "../models/diaDiem.model.js";

export const createDiaDiem = async (req, res, next) => {
  try {
    // const io = req.app.get("socketio");
    // if (!io) {
    //   console.error("Socket.IO not initialized in diadiemController");
    //   return res.status(500).json({ error: "Socket.IO not initialized" });
    // }
    const { maDiaDiem, tenDiaDiem, ghiChu, active } = req.body;

    const existingDiaDiem = await diaDiem.findOne({
      $or: [{ maDiaDiem: maDiaDiem }],
    });
    if (existingDiaDiem) {
      const error = new Error("Mã địa điểm đã tồn tại");
      error.statusCode = 409;
      throw error;
    }

    const newDiaDiem = await diaDiem.create([
      {
        maDiaDiem,
        tenDiaDiem,
        ghiChu,
        active,
      },
    ]);
    console.log("Emitting newDiadiem:", newDiaDiem);
    // io.emit("newDiadiem", newDiaDiem);

    res.status(201).json({
      status: "success",
      message: "Dia diem created successfully",
      data: {
        diaDiem: newDiaDiem,
      },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
