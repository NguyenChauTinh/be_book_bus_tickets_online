import express from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';

import ngrok from 'ngrok';
import { NGROK_AUTH_TOKEN, PORT } from './config/env.js';
import connectToDatabase from './database/mongodb.js';
import veXeRouter from './routes/veXe.route.js';
import paymentRouter from './routes/payment.route.js';


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"], 
    credentials: true,
  })
);

app.use('/api/v1/ve-xe', veXeRouter);
app.use('/api/v1/payment', paymentRouter);
// app.use(errorMiddleware);


const startServer = async () => {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Booking service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server", error);
    process.exit(1);
  }
};

startServer();

