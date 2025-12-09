import express from "express";
import cors from "cors";
import morgan from "morgan";
import setupProxies from "./middlewares/proxy.middleware.js";
import authMiddleware from "./middlewares/auth.middleware.js";

const app = express();

// Trust proxy (Ingress bắt buộc)
app.set("trust proxy", true);

// ----- 1. CORS -----
app.use(
  cors({
    origin: [
      "http://localhost:8000",
      "https://smart-bus-front-end.vercel.app",
      "https://smart-bus-front-end-baddevps-projects.vercel.app",
      "https://nhaxe.smartbus.io.vn","http://nhaxe.smartbus.io.vn",
      "http://api.smartbus.io.vn",
      "https://api.smartbus.io.vn",
      "https://smart-bus-front-end-git-main-baddevps-projects.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use((req, res, next) => {
  console.log(
    `[DEBUG GATEWAY ${new Date().toISOString()}] ${req.method} ${req.url}`
  );
  next();
});
app.get('/', (req, res) => {
  console.log("API-GATEWAY ENDPOINT v3.0.24");
  res.status(200).json({ status: 'UP', service: 'API-GATEWAY ENDPOINT /' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'HEALTH API-GATEWAY' });
});

app.get('/info', (req, res) => {
  res.json({ 
    status: 'UP',
    name: 'API-GATEWAY',
    timestamp: new Date()
  });
});

app.use(authMiddleware);

setupProxies(app);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found on Gateway",
  });
});

export default app;
