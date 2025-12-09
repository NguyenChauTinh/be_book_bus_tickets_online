import dotenv from "dotenv";
dotenv.config();

export const {
  PORT,
  TRIP_API_URL,
  PROMO_API_URL,
  BOOKING_API_URL,
  API_GEMINI_KEY,
  API_GEMINI_URL,
  GIAVE_API_URL,
  TUYEN_DUONG_API_URL,
} = process.env;
