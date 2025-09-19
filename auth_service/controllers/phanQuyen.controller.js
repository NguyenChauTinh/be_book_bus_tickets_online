import Quyen from "../models/phanQuyen.model.js";

export const taoQuyen = async (req, res) => {
    try {
        const { maPhanQuyen, tenPhanQuyen, chucNang } = req.body;

        const quyenDaTonTai = await Quyen.findOne({ maPhanQuyen });
        if (quyenDaTonTai) {
            return res.status(409).json({
                success: false,
                message: "Mã phân quyền đã tồn tại.",
            });
        }

        const quyenMoi = await Quyen.create({ maPhanQuyen, tenPhanQuyen, chucNang });

        res.status(201).json({
            success: true,
            message: "Tạo phân quyền thành công!",
            data: quyenMoi,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi server khi tạo phân quyền.",
            error: error.message,
        });
    }
};

// Cập nhật một phân quyền, bao gồm cả chức năng
export const capNhatQuyen = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenPhanQuyen, active, chucNang } = req.body;

        const updateData = {};
        if (tenPhanQuyen !== undefined) {
            updateData.tenPhanQuyen = tenPhanQuyen;
        }
        if (active !== undefined) {
            updateData.active = active;
        }
        if (chucNang !== undefined) {
            // Thay thế toàn bộ mảng chucNang bằng dữ liệu mới
            updateData.chucNang = chucNang;
        }

        const quyenCapNhat = await Quyen.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!quyenCapNhat) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phân quyền để cập nhật.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Cập nhật phân quyền thành công!",
            data: quyenCapNhat,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi server khi cập nhật phân quyền.",
            error: error.message,
        });
    }
};

// Giữ lại các hàm cũ
export const layDanhSachPhanQuyen = async (req, res) => {
    try {
        const danhSachQuyen = await Quyen.find({});
        res.status(200).json({
            success: true,
            message: "Lấy danh sách phân quyền thành công.",
            count: danhSachQuyen.length,
            data: danhSachQuyen,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy danh sách phân quyền.",
            error: error.message,
        });
    }
};

export const layChiTietPhanQuyen = async (req, res) => {
    try {
        const { id } = req.params;
        const quyen = await Quyen.findById(id);

        if (!quyen) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phân quyền.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Lấy chi tiết phân quyền thành công.",
            data: quyen,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy chi tiết phân quyền.",
            error: error.message,
        });
    }
};