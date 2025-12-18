import env from "./env.js";

const serviceRoutes = [
  { prefix: "/socket.io", target: env.SERVICES.BOOKING },

  // --- Auth Service ---
  { prefix: "/api/v1/nhan-vien", target: env.SERVICES.AUTH },
  { prefix: "/api/v1/tai-khoan", target: env.SERVICES.AUTH },
  { prefix: "/api/v1/vai-tro", target: env.SERVICES.AUTH },
  { prefix: "/api/v1/phan-quyen", target: env.SERVICES.AUTH },
  { prefix: "/api/v1/khach-hang", target: env.SERVICES.AUTH },
  { prefix: "/api/v1/tai-khoan-khach-hang", target: env.SERVICES.AUTH },

  // --- Trip Service ---
  { prefix: "/api/v1/chuyen-xe", target: env.SERVICES.TRIP },
  { prefix: "/api/v1/tuyen-duong", target: env.SERVICES.TRIP },
  { prefix: "/api/v1/dia-diem", target: env.SERVICES.TRIP },
  { prefix: "/api/v1/lich-chay", target: env.SERVICES.TRIP },
  { prefix: "/api/v1/gia-ve", target: env.SERVICES.TRIP },
  { prefix: "/api/v1/loai-xe", target: env.SERVICES.TRIP },
  { prefix: "/api/v1/xe", target: env.SERVICES.TRIP },
  { prefix: "/api/v1/don-vi-cong-tac", target: env.SERVICES.TRIP },

  // --- Booking Service ---
  { prefix: "/api/v1/ve-xe", target: env.SERVICES.BOOKING },
  { prefix: "/api/v1/payment", target: env.SERVICES.BOOKING },
  { prefix: "/api/v1/bao-cao", target: env.SERVICES.BOOKING },
  { prefix: "/api/v1/notifications", target: env.SERVICES.BOOKING },
  { prefix: "/api/v1/analytics", target: env.SERVICES.BOOKING },

  // --- Notification Service ---
  // { prefix: '/api/v1/thong-bao', target: env.SERVICES.NOTIFICATION },

  // --- Promotion Service ---
  { prefix: "/api/v1/khuyen-mai", target: env.SERVICES.PROMOTION },

  // --- AI Service ---
  { prefix: "/api/v1/chat", target: env.SERVICES.AI },
  //Socket IO
];

export default serviceRoutes;
