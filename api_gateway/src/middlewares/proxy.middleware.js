import { createProxyMiddleware } from "http-proxy-middleware";
import serviceRoutes from "../config/services.map.js";

const setupProxies = (app) => {
  serviceRoutes.forEach(({ prefix, target }) => {
    app.use(
      createProxyMiddleware({
        target: target,
        changeOrigin: true,
        pathFilter: prefix,
        ws: true,
        logLevel: "debug",
        timeout: 120000,
        proxyTimeout: 120000,
        changeOrigin: true,
        selfHandleResponse: false,
        onProxyReq: (proxyReq, req, res) => {
          console.log(
            `[Proxy] ${req.method} ${req.originalUrl} -> ${target}${req.url}`
          );
        },
        onError: (err, req, res) => {
          console.error(`[Proxy Error] Cannot reach ${target}`);
          res.status(503).json({ message: "Service Unavailable" });
        },
      })
    );
  });
};

export default setupProxies;
