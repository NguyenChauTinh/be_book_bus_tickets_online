import express from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';

import { PORT } from './config/env.js';
import connectToDatabase from './database/mongodb.js';
import veXeRouter from './routes/veXe.route.js';


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use('/api/v1/ve-xe', veXeRouter);
// app.use(errorMiddleware);

app.listen(PORT, async () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
  console.log(new Date());
  await connectToDatabase();
});
export default app;