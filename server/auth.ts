// server/auth.ts - WITH HARDCODED SECRET
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { RequestHandler } from "express";

const PgSession = connectPg(session);

// 🔥 HARDCODE SESSION_SECRET - THÊM Ở ĐÂY
const HARDCODED_SESSION_SECRET = "9f1a3a94f9c62efb3b7851a7e18cf47b08b0b78dc726f8e12af418fc26a0b71973e3f2c7f5b72f1485d30db58a38bbdbd74a6226d6537eb3be3d6b4c19b02c88";

// Session configuration
export function getSessionMiddleware() {
  // 🔥 SỬA PHẦN VALIDATION - THÊM FALLBACK
  if (!process.env.SESSION_SECRET) {
    console.log('🔧 Using hardcoded SESSION_SECRET');
    process.env.SESSION_SECRET = HARDCODED_SESSION_SECRET;
  }

  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // 🔥 CŨNG HARDCODE DATABASE_URL CHO SESSION STORE
  const databaseUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_U1ySBcv2eGqr@ep-square-silence-ad2mp4tq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";
  
  const sessionStore = new PgSession({
    conString: databaseUrl,
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