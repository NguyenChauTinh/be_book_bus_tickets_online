import DonViCongTac from '../models/donViCongTac.model.js';
import redisClient from '../config/redis.js';
const clearDonViCache = async () => {
    const keys = await redisClient.keys('donvicongtac:*');
    
    if (keys.length > 0) {
        await redisClient.del(keys);
        console.log('Đã xóa cache đơn vị công tác');
    }
};
export const getAllDonViCongTac = async (req, res) => {
    try {
        const { loaiDonVi, trangThai } = req.query;

        let redisKey = '';
        const filter = {};
        
        const statusKey = trangThai !== undefined ? trangThai : true;

        if (loaiDonVi === 'VANPHONG') {
            redisKey = `donvicongtac:group_vanphong:${statusKey}`;
            filter.loaiDonVi = 'VANPHONG';
        } 
        else if (!loaiDonVi) {
            redisKey = `donvicongtac:group_doitac:${statusKey}`;
            filter.loaiDonVi = { $in: ["DAILY", "NGANHANG"] };
        } 
        else {
            redisKey = `donvicongtac:single_${loaiDonVi}:${statusKey}`;
            filter.loaiDonVi = loaiDonVi;
        }

        if (trangThai !== undefined) {
            filter.trangThai = trangThai === 'true';
        }

        const cachedData = await redisClient.get(redisKey);
        
        if (cachedData) {
            return res.status(200).json({ 
                success: true, 
                message: "Dữ liệu từ Cache", 
                data: JSON.parse(cachedData) 
            });
        }

        const donVis = await DonViCongTac.find(filter).sort({ createdAt: -1 });

        if (donVis) {
            await redisClient.setEx(redisKey, 24 * 3600, JSON.stringify(donVis));
        }

        res.status(200).json({ 
            success: true, 
            data: donVis 
        });

    } catch (err) {
        console.error("Lỗi getAllDonViCongTac:", err);
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
        await clearDonViCache();
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
        await clearDonViCache();
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
        await clearDonViCache();
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
        await clearDonViCache();
        res.status(200).json({ message: 'Đơn vị công tác đã được khôi phục', data: donVi });
    } catch (err) {
        res.status(500).json({ message: 'Đã xảy ra lỗi trong quá trình xử lý: ' + err.message });
    }
};