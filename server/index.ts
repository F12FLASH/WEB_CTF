// server/index.ts - SIMPLE VERSION
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
console.log('🔍 index.ts - Loading environment...');
config({ path: path.resolve(__dirname, '.env') });

console.log('🔍 index.ts - DATABASE_URL:', process.env.DATABASE_URL ? '✅ Loaded' : '❌ Missing');

// Bây giờ mới import các module khác
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.set("trust proxy", 1);

const isDevelopment = process.env.NODE_ENV === 'development';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: isDevelopment 
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
        : ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: "deny",
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log('🚀 Starting server...');
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = isDevelopment ? err.message || "Internal Server Error" : "Internal Server Error";
      
      if (isDevelopment) {
        console.error("Error:", err);
      } else {
        console.error("Error occurred:", message);
      }

      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const PORT = 5000;
    const HOST = "127.0.0.1";
    
    server.listen(PORT, HOST, () => {
      log(`✅ Server successfully started on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    log(`❌ Server startup error: ${error}`);
    process.exit(1);
  }

  // server/index.ts - THÊM Ở ĐẦU SAU IMPORTS
// 🔥 HARDCODE FALLBACKS
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = "9f1a3a94f9c62efb3b7851a7e18cf47b08b0b78dc726f8e12af418fc26a0b71973e3f2c7f5b72f1485d30db58a38bbdbd74a6226d6537eb3be3d6b4c19b02c88";
}
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}
})();