import session from "express-session";
import connectPg from "connect-pg-simple";
import type { RequestHandler } from "express";

const PgSession = connectPg(session);

// Session configuration
export function getSessionMiddleware() {
  if (!process.env.SESSION_SECRET) {
    throw new Error(
      "SESSION_SECRET must be set. This is required for secure session management.",
    );
  }

  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  const sessionStore = new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const isProduction = process.env.NODE_ENV === "production";
  
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: "sessionId", // Custom name instead of default connect.sid
    cookie: {
      httpOnly: true, // Prevent XSS attacks
      secure: isProduction, // HTTPS only in production
      maxAge: sessionTtl,
      sameSite: "strict", // Strict for better CSRF protection
      path: "/",
      domain: undefined, // Let browser determine
    },
    proxy: true, // Trust proxy for secure cookies
    rolling: true, // Refresh session on each request
  });
}

// Admin authentication middleware
export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ message: "Unauthorized - Admin login required" });
  }
  next();
};

// User authentication middleware
export const requireUser: RequestHandler = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Unauthorized - Please login to continue" });
  }
  next();
};

// Extend session type
declare module 'express-session' {
  interface SessionData {
    adminId: string;
    adminUsername: string;
    userId: string;
    username: string;
  }
}
