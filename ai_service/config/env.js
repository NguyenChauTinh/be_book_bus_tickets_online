import dotenv from "dotenv";
dotenv.config();

export const { EUREKA_HOST, EUREKA_PORT, SERVICE_NAME, PORT } = process.env;
