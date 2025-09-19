import NhanVien from '../models/nhanVien.model.js';

export const layDanhSachNhanVien = async (req, res) => {
    try {
        const { hoatDong, loaiNhanVien } = req.query;
        let filter = {};

        if (hoatDong === 'true') {
            filter.hoatDong = true;
        } else if (hoatDong === 'false') {
            filter.hoatDong = false;
        }
        
        if (loaiNhanVien) {
            filter.loaiNhanVien = loaiNhanVien.toUpperCase();
        }

        const danhSachNhanVien = await NhanVien.find(filter);

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách nhân viên thành công.',
            count: danhSachNhanVien.length,
            data: danhSachNhanVien,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách nhân viên.',
            error: error.message,
        });
    }
};

export const taoNhanVien = async (req, res) => {
    try {
        const { maNhanVien, tenNhanVien, soDienThoai, namSinh, loaiNhanVien } = req.body;

        const nhanVienDaTonTai = await NhanVien.findOne({
            $or: [{ maNhanVien }, { soDienThoai }],
        });
        if (nhanVienDaTonTai) {
            return res.status(409).json({
                success: false,
                message: 'Mã nhân viên hoặc số điện thoại đã tồn tại.',
            });
        }

        const nhanVienMoi = await NhanVien.create({
            maNhanVien,
            tenNhanVien,
            soDienThoai,
            namSinh,
            loaiNhanVien: loaiNhanVien ? loaiNhanVien.toUpperCase() : undefined,
        });

        res.status(201).json({
            success: true,
            message: 'Tạo nhân viên thành công!',
            data: nhanVienMoi,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo nhân viên.',
            error: error.message,
        });
    }
};

export const capNhatNhanVien = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenNhanVien, soDienThoai, namSinh, loaiNhanVien } = req.body;

        const nhanVien = await NhanVien.findById(id);
        if (!nhanVien) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên để cập nhật.',
            });
        }

        if (soDienThoai && soDienThoai !== nhanVien.soDienThoai) {
            const soDienThoaiDaTonTai = await NhanVien.findOne({ soDienThoai });
            if (soDienThoaiDaTonTai) {
                return res.status(409).json({
                    success: false,
                    message: 'Số điện thoại đã tồn tại.',
                });
            }
        }

        const nhanVienCapNhat = await NhanVien.findByIdAndUpdate(
            id,
            { tenNhanVien, soDienThoai, namSinh, loaiNhanVien: loaiNhanVien ? loaiNhanVien.toUpperCase() : undefined },
            { new: true, runValidators: true },
        );

        res.status(200).json({
            success: true,
            message: 'Cập nhật nhân viên thành công.',
            data: nhanVienCapNhat,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật nhân viên.',
            error: error.message,
        });
    }
};

export const capNhatTrangThaiNhanVien = async (req, res) => {
    try {
        const { id } = req.params;
        const { hoatDong } = req.body;

        const nhanVien = await NhanVien.findByIdAndUpdate(
            id,
            { hoatDong },
            { new: true },
        );

        if (!nhanVien) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên.',
            });
        }

        res.status(200).json({
            success: true,
            message: `Trạng thái nhân viên đã được cập nhật thành ${hoatDong ? 'hoạt động' : 'không hoạt động'}.`,
            data: nhanVien,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật trạng thái nhân viên.',
            error: error.message,
        });
    }
};

export const timNhanVienTheoMa = async (req, res) => {
    try {
        const { maNhanVien } = req.params;
        const nhanVien = await NhanVien.findOne({ maNhanVien });
        if (!nhanVien) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên với mã đã cho.',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Tìm nhân viên thành công.',
            data: nhanVien,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tìm nhân viên.',
            error: error.message,
        });
    }
};