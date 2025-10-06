import VeXe from '../models/veXe.model.js';
// import mongoose from 'mongoose'; // Không cần thiết cho validation chuyenXeId nữa

const generateMaVe = () => 'VEX-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);

export const getTicketsByChuyenXeId = async (req, res) => {
    try {
        const { chuyenXeId } = req.params;

        if (!chuyenXeId) {
             return res.status(400).json({ success: false, message: 'ID chuyến xe không được để trống.' });
        }
        
        const tickets = await VeXe.find({ chuyenXe: chuyenXeId }).lean(); 
            

        res.status(200).json({ success: true, data: tickets });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách vé theo chuyến xe:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

export const createTicket = async (req, res) => {
    try {
        const { chuyenXe, tenKhachHang, soDienThoai, chiTiet } = req.body;
        console.log("ve xe = ",req.body);
        if (!chuyenXe || !tenKhachHang || !soDienThoai || !chiTiet || chiTiet.length === 0) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin chuyến đi, khách hàng hoặc chi tiết vé.' });
        }

        const tongTien = chiTiet.reduce((sum, item) => sum + item.giaVeCoBan + item.phuThu - item.giamGia, 0);

        const newTicket = new VeXe({
            maVe: generateMaVe(),
            chuyenXe,
            tenKhachHang,
            soDienThoai,
            chiTiet,
            tongTien,
            tongTienPhaiTra: tongTien, 
            tongTienDaThanhToan: 0, 
            trangThaiVe: 'CHO_THANH_TOAN',
        });

        const savedTicket = await newTicket.save();

        res.status(201).json({ success: true, message: 'Tạo vé xe thành công.', data: savedTicket });
    } catch (error) {
        console.error('Lỗi khi tạo vé xe:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ: ' + error.message });
    }
};

export const updateTicketDetails = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const updates = req.body.chiTietUpdates; 

        if (!mongoose.Types.ObjectId.isValid(ticketId)) {
             return res.status(400).json({ success: false, message: 'ID vé xe không hợp lệ.' });
        }
        
        const ticket = await VeXe.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy vé xe.' });
        }

        for (const update of updates) {
            const chiTiet = ticket.chiTiet.id(update.chiTietId);
            if (chiTiet) {
                Object.assign(chiTiet, update.updates);
            }
        }
        
        const newTongTien = ticket.chiTiet.reduce((sum, item) => sum + item.giaVeCoBan + item.phuThu - item.giamGia, 0);
        ticket.tongTien = newTongTien;
        ticket.tongTienPhaiTra = newTongTien; 

        await ticket.save();

        res.status(200).json({ success: true, message: 'Cập nhật chi tiết vé xe thành công.', data: ticket });
    } catch (error) {
        console.error('Lỗi khi cập nhật chi tiết vé xe:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

export const updateTicketDetailStatus = async (req, res) => {
    try {
        const { ticketId, chiTietId } = req.params;
        const { trangThaiChiTiet } = req.body;

        if (!mongoose.Types.ObjectId.isValid(ticketId) || !mongoose.Types.ObjectId.isValid(chiTietId)) {
            return res.status(400).json({ success: false, message: 'ID vé xe hoặc chi tiết vé không hợp lệ.' });
        }
        
        const result = await VeXe.findOneAndUpdate(
            { "_id": ticketId, "chiTiet._id": chiTietId },
            { "$set": { "chiTiet.$.trangThaiChiTiet": trangThaiChiTiet } },
            { new: true } 
        );

        if (!result) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy vé xe hoặc chi tiết vé.' });
        }
        
        const allCancelled = result.chiTiet.every(detail => detail.trangThaiChiTiet === 'DA_HUY');
        if (allCancelled && result.trangThaiVe !== 'DA_HUY') {
             result.trangThaiVe = 'DA_HUY';
             await result.save();
        }

        res.status(200).json({ success: true, message: `Cập nhật trạng thái chi tiết vé ${chiTietId} thành công.`, data: result });
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái chi tiết vé:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};

export const searchTickets = async (req, res) => {
    try {
        const { query } = req.query; 

        if (!query || query.length < 3) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tối thiểu 3 ký tự để tìm kiếm.' });
        }

        const searchRegex = new RegExp(query, 'i'); 

        const tickets = await VeXe.find({
            $or: [
                { maVe: searchRegex }, 
                { 'soDienThoai': searchRegex }, 
                { 'tenKhachHang': searchRegex }, 
            ]
        })
        .limit(20) 
        .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: tickets });
    } catch (error) {
        console.error('Lỗi khi tìm kiếm vé xe:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
    }
};