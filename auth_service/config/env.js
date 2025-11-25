import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });
console.log("DB_URI loaded is:", process.env.DB_URI);

export const {
  NODE_ENV,
  PORT,
  DB_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REDIS_URL,
  RABBITMQ_URL,
  NOTIFICATION_EXCHANGE,
  OTP_EXPIRY_SECONDS,
  SESSION_EXPIRY_SECONDS

} = process.env;
