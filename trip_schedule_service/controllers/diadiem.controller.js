import axios from "axios";
import { PORT } from "../config/env.js";

import DiaDiem from "../models/diaDiem.model.js";
import diadiem from "../models/diaDiem.model.js";

export const createDiaDiem = async (req, res, next) => {
  try {
    // const io = req.app.get("socketio");
    // if (!io) {
    //   console.error("Socket.IO not initialized in diadiemController");
    //   return res.status(500).json({ error: "Socket.IO not initialized" });
    // }
    const { maDiaDiem, tenDiaDiem, diaChi, ghiChu, active } = req.body;

    const existingDiaDiem = await DiaDiem.findOne({
      $or: [{ maDiaDiem: maDiaDiem }],
    });
    if (existingDiaDiem) {
      const error = new Error("Mã địa điểm đã tồn tại");
      error.statusCode = 409;
      throw error;
    }

    const newDiaDiem = await DiaDiem.create([
      {
        maDiaDiem,
        tenDiaDiem,
        ghiChu,
        active,
        diaChi,
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

export const getAllDiaDiem = async (req, res) => {
  const list = await DiaDiem.find();
  res.json(list);
};

export const getDiaDiemById = async (req, res) => {
  const { id } = req.params;
  const diaDiem = await DiaDiem.findById(id);
  if (!diaDiem) {
    return res.status(404).json({ message: "Địa điểm không tồn tại" });
  }
  res.json(diaDiem);
};

export const updateDiaDiem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { maDiaDiem, tenDiaDiem, diaChi, ghiChu, active } = req.body;
    const diaDiem = await DiaDiem.findById(id);
    if (!diaDiem) {
      const error = new Error("Địa điểm không tồn tại");
      error.statusCode = 404;
      throw error;
    }
    const existingDiaDiem = await DiaDiem.findOne({
      $or: [{ maDiaDiem: maDiaDiem }],
      _id: { $ne: id },
    });
    if (existingDiaDiem) {
      const error = new Error("Mã địa điểm đã tồn tại");
      error.statusCode = 409;
      throw error;
    }
    diaDiem.maDiaDiem = maDiaDiem;
    diaDiem.tenDiaDiem = tenDiaDiem;
    diaDiem.ghiChu = ghiChu;
    diaDiem.active = active;
    diaDiem.diaChi = diaChi;
    await diaDiem.save();
    // const io = req.app.get("socketio");
    // if (!io) {
    //   console.error("Socket.IO not initialized in diadiemController");
    //   return res.status(500).json({ error: "Socket.IO not initialized" });
    // }
    // io.emit("updateDiadiem", diaDiem);
    res.json({
      status: "success",
      message: "Dia diem updated successfully",
      data: {
        diaDiem,
      },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteDiaDiem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const diaDiem = await DiaDiem.findById(id);
    if (!diaDiem) {
      const error = new Error("Địa điểm không tồn tại");
      error.statusCode = 404;
      throw error;
    }
    await DiaDiem.findByIdAndDelete(id);
    // const io = req.app.get("socketio");
    // if (!io) {
    //   console.error("Socket.IO not initialized in diadiemController");
    //   return res.status(500).json({ error: "Socket.IO not initialized" });
    // }
    // io.emit("deleteDiadiem", id);
    res.json({
      status: "success",
      message: "Dia diem deleted successfully",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// Lấy địa điểm active = true
export const getActiveDiaDiem = async (req, res, next) => {
  try {
    const activeDiaDiem = await DiaDiem.find({ active: true });
    res.json(activeDiaDiem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// diadiem active, thay doi khi nhan nut xoa tren giao dien giua true hoac false
export const toggleActiveDiaDiem = async (req, res, next) => {
  console.log("Toggle Active DiaDiem called");
  try {
    console.log("Toggle Active DiaDiem called");
    console.log("Request Params:", req.params);
    const { id } = req.params;
    const diaDiem = await DiaDiem.findById(id);
    if (!diaDiem) {
      const error = new Error("Địa điểm không tồn tại");
      error.statusCode = 404;
      throw error;
    }
    diaDiem.active = !diaDiem.active;
    await diaDiem.save();
    // const io = req.app.get("socketio");
    // if (!io) {
    //   console.error("Socket.IO not initialized in diadiemController");
    //   return res.status(500).json({ error: "Socket.IO not initialized" });
    // }
    // io.emit("toggleActiveDiadiem", diaDiem);
    res.json({
      status: "success",
      message: "Dia diem active status toggled successfully",
      data: {
        diaDiem,
      },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};
