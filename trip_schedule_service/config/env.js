import dotenv from "dotenv";
dotenv.config();

export const { NODE_ENV, PORT, MONGO_URI_LOCAL, MONGO_URI_ATLAS } = process.env;
