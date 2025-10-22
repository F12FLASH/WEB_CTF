import type { Express } from "express";
import { createServer, type Server } from "http";
import { getSessionMiddleware } from "./auth";
import { cookieParser, setCsrfToken, verifyCsrfToken } from "./middleware/csrf";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import challengeRoutes from "./routes/challenge.routes";
import announcementRoutes from "./routes/announcement.routes";
import publicRoutes from "./routes/public.routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply cookie parser middleware (required for CSRF)
  app.use(cookieParser());
  
  // Apply session middleware globally
  app.use(getSessionMiddleware());

  // Set CSRF token cookie on all requests
  app.use(setCsrfToken);

  // Verify CSRF token on state-changing requests
  app.use(verifyCsrfToken);

  // Mount route modules
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/challenges", challengeRoutes);
  app.use("/api/announcements", announcementRoutes);
  app.use("/api", publicRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
