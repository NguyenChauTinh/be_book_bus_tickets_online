import { config } from "dotenv";

config();

export const {
  NODE_ENV,
  PORT,
  RABBITMQ_URL,
  NOTIFICATION_EXCHANGE,
  NOTIFICATION_QUEUE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_HOST,
  SMTP_PORT,

} = process.env;
