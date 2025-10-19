import DonViCongTac from '../models/donViCongTac.model.js';

export const getAllDonViCongTac = async (req, res) => {
    try {
        const { loaiDonVi, trangThai } = req.query;
        const filter = {};

        if (loaiDonVi) {
            filter.loaiDonVi = loaiDonVi;
        }

        if (trangThai !== undefined) {
            filter.trangThai = trangThai === 'true';
        }

        const donVis = await DonViCongTac.find(filter);
        res.status(200).json({data : donVis});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getDonViCongTacById = async (req, res) => {
    try {
        const donVi = await DonViCongTac.findById(req.params.id);
        if (!donVi) {
            return res.status(404).json({ message: 'Không tìm thấy đơn vị công tác' });
        }
        res.status(200).json(donVi);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const createDonViCongTac = async (req, res) => {
    const donVi = new DonViCongTac({
        maDonVi: req.body.maDonVi,
        tenDonVi: req.body.tenDonVi,
        soDienThoai: req.body.soDienThoai,
        diaChi: req.body.diaChi,
        loaiDonVi: req.body.loaiDonVi,
        ghiChu: req.body.ghiChu,
        trangThai: req.body.trangThai,
    });

    try {
        const newDonVi = await donVi.save();
        res.status(201).json(newDonVi);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const updateDonViCongTac = async (req, res) => {
    try {
        const updatedDonVi = await DonViCongTac.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedDonVi) {
            return res.status(404).json({ message: 'Không tìm thấy đơn vị công tác' });
        }
        res.status(200).json(updatedDonVi);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const deactivateDonViCongTac = async (req, res) => {
    try {
        const donVi = await DonViCongTac.findByIdAndUpdate(
            req.params.id,
            { trangThai: false },
            { new: true, runValidators: true } 
        );
        if (!donVi) {
            return res.status(404).json({ message: 'Không tìm thấy đơn vị công tác' });
        }
        res.status(200).json({ message: 'Đơn vị công tác đã được vô hiệu hóa', data: donVi });
    } catch (err) {
        res.status(500).json({ message: 'Đã xảy ra lỗi trong quá trình xử lý: ' + err.message });
    }
};

export const activateDonViCongTac = async (req, res) => {
    try {
        const donVi = await DonViCongTac.findByIdAndUpdate(
            req.params.id,
            { trangThai: true },
            { new: true, runValidators: true }
        );
        if (!donVi) {
            return res.status(404).json({ message: 'Không tìm thấy đơn vị công tác' });
        }
        res.status(200).json({ message: 'Đơn vị công tác đã được khôi phục', data: donVi });
    } catch (err) {
        res.status(500).json({ message: 'Đã xảy ra lỗi trong quá trình xử lý: ' + err.message });
    }
};