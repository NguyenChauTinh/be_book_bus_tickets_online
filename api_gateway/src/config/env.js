// src/config/env.js
import dotenv from "dotenv";
import path from "path";
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: ".env" }); 
}
const {
  URL_AUTH_SERVICE,
  URL_TRIP_SERVICE,
  URL_BOOKING_SERVICE,
  URL_PROMOTION_SERVICE,
  URL_AI_SERVICE,
} = process.env;
const env = {
  PORT: process.env.PORT || 3000,

  SERVICES: {
    AUTH: URL_AUTH_SERVICE,
    TRIP: URL_TRIP_SERVICE,
    BOOKING: URL_BOOKING_SERVICE,
    PROMOTION: URL_PROMOTION_SERVICE,
    AI: URL_AI_SERVICE,
  },
  JWT_SECRET: process.env.JWT_SECRET,
  REDIS_URL: process.env.REDIS_URL,
};

export default env;
