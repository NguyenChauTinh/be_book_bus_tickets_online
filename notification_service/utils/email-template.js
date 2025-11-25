const PRIMARY_COLOR = '#0a6ebd';
const TEXT_COLOR = '#333333';
const BG_COLOR = '#f4f7fa';
const LINK_TO_APP_HOMEPAGE = 'https://smartbus.example.com';

export function getBookingSuccessTemplate(data) {
    const { bookingId, tripDetails, seats, totalPrice, userName, departureDate } = data;
    const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice);
    console.log("Dữ liệu trong template đặt vé:", data);
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác nhận Đặt vé Thành công</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: ${BG_COLOR}; margin: 0; padding: 0; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: ${PRIMARY_COLOR}; color: #ffffff; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; color: ${TEXT_COLOR}; }
            .content p { line-height: 1.6; }
            .details-box { border: 1px solid #eeeeee; border-radius: 6px; padding: 15px; margin-top: 20px; }
            .details-row { padding: 8px 0; border-bottom: 1px dashed #cccccc; display: flex; justify-content: space-between; }
            .details-row:last-child { border-bottom: none; }
            .highlight { color: ${PRIMARY_COLOR}; font-weight: bold; font-size: 1.1em; }
            .button { display: inline-block; padding: 12px 25px; margin-top: 25px; background-color: #28a745; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #888888; }
        </style>
    </head>
    <body>
        <div style="padding: 20px;">
            <div class="container">
                <div class="header">
                    <h1>🎉 Vé của bạn đã được xác nhận!</h1>
                </div>
                <div class="content">
                    <p>Xin chào ${userName || 'Quý khách'},</p>
                    <p>Cảm ơn bạn đã tin tưởng và đặt dịch vụ tại hệ thống đặt vé xe của chúng tôi. Dưới đây là thông tin chi tiết về chuyến đi của bạn:</p>

                    <div class="details-box">
                        <div class="details-row">
                            <span>Mã đặt chỗ:</span>
                            <span class="highlight">${bookingId}</span>
                        </div>
                        <div class="details-row">
                            <span>Tuyến xe:</span>
                            <span>${tripDetails.route || 'N/A'}</span>
                        </div>
                        <div class="details-row">
                            <span>Thời gian khởi hành:</span>
                            <span>${departureDate || 'N/A'} (Tại ${tripDetails.selectedPickup.name || 'N/A'})</span>
                            
                        </div>
                        <div class="details-row">
                            <span>Số ghế:</span>
                            <span>${seats.join(', ') || 'N/A'}</span>
                        </div>
                        <div class="details-row" style="background-color: #f7f7f7; font-weight: bold;">
                            <span>Tổng thanh toán:</span>
                            <span class="highlight" style="color: #dc3545;">${formattedPrice}</span>
                        </div>
                    </div>
                    
                    <p style="margin-top: 25px;">Vui lòng có mặt tại điểm đón <span class="highlight">trước 30 phút</span>. Nếu có bất kỳ thắc mắc nào, đừng ngần ngại liên hệ với chúng tôi.</p>
                    
                    <div style="text-align: center;">
                        <a href="[LINK_TO_VIEW_TICKET]" class="button">Xem chi tiết Vé điện tử</a>
                    </div>
                </div>
                <div class="footer">
                    &copy; 2024 Hệ thống Đặt vé xe SmartBus.
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

export function getRegistrationSuccessTemplate(data) {
    const { userName, email } = data;
    
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chào mừng đến với hệ thống</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: ${BG_COLOR}; margin: 0; padding: 0; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: #007bff; color: #ffffff; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; color: ${TEXT_COLOR}; }
            .content p { line-height: 1.6; }
            .button { display: inline-block; padding: 12px 25px; margin-top: 25px; background-color: #007bff; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #888888; }
        </style>
    </head>
    <body>
        <div style="padding: 20px;">
            <div class="container">
                <div class="header">
                    <h1>Chào mừng ${userName}!</h1>
                </div>
                <div class="content">
                    <p>Hệ thống đặt vé xe chúc mừng bạn đã đăng ký tài khoản thành công với địa chỉ email: <b>${email}</b>.</p>
                    <p>Bạn đã sẵn sàng để bắt đầu chuyến hành trình tiếp theo của mình. Khám phá các tuyến đường và đặt chỗ ngay hôm nay!</p>
                    
                    <div style="text-align: center;">
                        <a href="${LINK_TO_APP_HOMEPAGE}" class="button">Bắt đầu Đặt vé</a>
                    </div>

                    <p style="margin-top: 30px; font-style: italic;">Nếu bạn không phải là người đăng ký tài khoản này, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ của chúng tôi.</p>
                </div>
                <div class="footer">
                    &copy; 2024 Hệ thống Đặt vé xe SmartBus.
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}
export function getPaymentSuccessTemplate(data) {
    const { bookingId, amount, transactionId, paymentTime, customerName, paymentMethod } = data;
    const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const formattedDate = paymentTime ? new Date(paymentTime).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');

    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thanh toán thành công</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f7fa; margin: 0; padding: 0; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: #28a745; color: #ffffff; padding: 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; color: #333333; }
            .details-box { border: 1px solid #eeeeee; border-radius: 6px; padding: 15px; margin-top: 20px; background-color: #f9fff9; }
            .details-row { padding: 8px 0; border-bottom: 1px dashed #cccccc; display: flex; justify-content: space-between; }
            .details-row:last-child { border-bottom: none; }
            .highlight { color: #28a745; font-weight: bold; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #888888; }
        </style>
    </head>
    <body>
        <div style="padding: 20px;">
            <div class="container">
                <div class="header">
                    <h1>🎉 Thanh toán Thành công!</h1>
                </div>
                <div class="content">
                    <p>Xin chào <b>${customerName || 'Quý khách'}</b>,</p>
                    <p>Hệ thống xác nhận bạn đã thanh toán thành công cho vé xe <b>${bookingId}</b>.</p>

                    <div class="details-box">
                        <div class="details-row">
                            <span>Mã giao dịch:</span>
                            <span style="font-weight:bold;">${transactionId}</span>
                        </div>
                        <div class="details-row">
                            <span>Mã vé:</span>
                            <span style="font-weight:bold;">${bookingId}</span>
                        </div>
                        <div class="details-row">
                            <span>Số tiền:</span>
                            <span class="highlight">${formattedPrice}</span>
                        </div>
                        <div class="details-row">
                            <span>Thời gian:</span>
                            <span>${formattedDate}</span>
                        </div>
                        <div class="details-row">
                            <span>Phương thức:</span>
                            <span>${paymentMethod}</span>
                        </div>
                    </div>
                    
                    <p style="margin-top: 25px;">Cảm ơn bạn đã sử dụng dịch vụ!</p>
                </div>
                <div class="footer">
                    &copy; 2024 Hệ thống Đặt vé xe Microservice.
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}