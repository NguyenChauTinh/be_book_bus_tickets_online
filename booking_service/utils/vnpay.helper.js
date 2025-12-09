// utils/vnpay.helper.js

import moment from 'moment';
import crypto from 'crypto';
import queryString from 'qs';
import { 
    VNP_HASHSECRET, 
    VNP_TMNCODE, 
    VNP_URL, 
    VNP_RETURN_URL, 
    VNP_IPN_URL 
} from '../config/env.js';

// Hàm sắp xếp các trường theo thứ tự A-Z
const sortObject = (obj) => {
    let sorted = {};
    let keys = Object.keys(obj).sort();
    for (let key of keys) {
        // Chỉ thêm vào đối tượng đã sắp xếp nếu giá trị không rỗng (null, undefined, rỗng)
        if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
            sorted[key] = obj[key];
        }
    }
    return sorted;
};

// Hàm tạo Payment URL chuẩn VNPay
export const buildPaymentUrl = (amount, ipAddr, orderInfo, orderId, bankCode = null) => {
    const date = new Date();
    // Tạo ngày tháng năm theo format YYYYMMDDHHmmss
    const createDate = moment(date).format('YYYYMMDDHHmmss'); 

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = VNP_TMNCODE;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId; // Mã hóa đơn
    vnp_Params['vnp_OrderInfo'] = orderInfo;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100; // VNPay tính bằng cent
    vnp_Params['vnp_ReturnUrl'] = VNP_RETURN_URL;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    // vnp_Params['vnp_IpnUrl'] = VNP_IPN_URL;

    // Thêm BankCode nếu có
    if (bankCode) {
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);
    
    const signData = queryString.stringify(vnp_Params, { encode: false });
    
    const hmac = crypto.createHmac('sha512', VNP_HASHSECRET);
    const vnp_SecureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnp_Params['vnp_SecureHash'] = vnp_SecureHash;

    return VNP_URL + '?' + queryString.stringify(vnp_Params, { encode: false });
};

// Hàm kiểm tra Ipn (Webhook) chuẩn VNPay
export const verifyIpn = (vnp_Params) => {
    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType']; 

    vnp_Params = sortObject(vnp_Params);
    
    const signData = queryString.stringify(vnp_Params, { encode: false });

    const hmac = crypto.createHmac('sha512', VNP_HASHSECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
};