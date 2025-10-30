import express from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';

import ngrok from 'ngrok';
import { NGROK_AUTH_TOKEN, PORT } from './config/env.js';
import connectToDatabase from './database/mongodb.js';
import veXeRouter from './routes/veXe.route.js';


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
// app.use(errorMiddleware);


const startServer = async () => {
  try {
    await connectToDatabase();

    app.listen(PORT, () => {
      console.log(`✅ Booking service is running on port ${PORT}`);

      if (process.env.NODE_ENV === 'development') {
        // Double-check the PORT value before connecting
        console.log(`Attempting to connect ngrok to port: ${PORT}`);

        ngrok.connect({
          proto: 'http',
          addr: PORT, // ✔️ Corrected to use the actual server port
          authtoken: NGROK_AUTH_TOKEN,
        }).then(url => {
          console.log(`🌍 Ngrok tunnel is running at: ${url}`);
          console.log(`🔗 VNPAY IPN URL should be: ${url}/api/payment/vnpay_ipn`);
        }).catch(error => {
          console.error('❌ Error while connecting to Ngrok:', error);
        });
      }
    });
  } catch (error) {
    console.error("❌ Failed to start the server", error);
    process.exit(1);
  }
};

startServer();
process.on('SIGINT', async () => {
  console.log('👋 Stopping server and disconnecting Ngrok...');
  await ngrok.disconnect(); 
  await ngrok.kill();      
  process.exit(0);
});
