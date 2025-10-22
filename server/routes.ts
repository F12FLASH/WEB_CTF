import type { Express } from "express";
import { createServer, type Server } from "http";
import { getSessionMiddleware } from "./auth";
import { cookieParser, setCsrfToken, verifyCsrfToken } from "./middleware/csrf";
import { storage } from "./storage";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import challengeRoutes from "./routes/challenge.routes";
import announcementRoutes from "./routes/announcement.routes";
import publicRoutes from "./routes/public.routes";
import installRoutes from "./routes/install.routes";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cookieParser());
  app.use(getSessionMiddleware());
  
  app.use("/api/install", installRoutes);
  
  app.use(setCsrfToken);
  app.use(verifyCsrfToken);

  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/challenges", challengeRoutes);
  app.use("/api/announcements", announcementRoutes);
  app.use("/api", publicRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
