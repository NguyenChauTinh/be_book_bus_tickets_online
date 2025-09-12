import mongoose from "mongoose";

const env = process.env.NODE_ENV || "development";
const MONGO_URI =
  env === "production"
    ? process.env.MONGO_URI_ATLAS
    : process.env.MONGO_URI_LOCAL;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
};

export default connectDB;
