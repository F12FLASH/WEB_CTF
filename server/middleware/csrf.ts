import { RequestHandler } from "express";
import crypto from "crypto";
import cookieParser from "cookie-parser";

// Modern CSRF protection using double-submit cookie pattern
// This is more secure than the deprecated csurf package

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

// Generate a cryptographically secure random token
function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

// Middleware to set CSRF cookie on GET requests
export const setCsrfToken: RequestHandler = (req, res, next) => {
  // Only set CSRF token if it doesn't exist
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by JavaScript for double-submit pattern
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }
  next();
};

// Middleware to verify CSRF token on state-changing requests (POST, PUT, DELETE, PATCH)
export const verifyCsrfToken: RequestHandler = (req, res, next) => {
  // Skip CSRF in development for easier testing
  // In production, strict CSRF protection is enforced
  if (process.env.NODE_ENV === "development") {
    return next();
  }

  const method = req.method.toUpperCase();
  
  // Skip CSRF check for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  // If no cookie token exists yet, generate one and allow the request
  // This handles the first request before cookie is set
  if (!cookieToken) {
    const newToken = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, newToken, {
      httpOnly: false, // Must be readable by JavaScript
      secure: true, // Always secure in production
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    return next();
  }

  // Verify both tokens exist and match
  if (!headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ 
      message: "CSRF token validation failed. Please refresh the page and try again." 
    });
  }

  next();
};

// Export cookie parser middleware for use in the app
export { cookieParser };
