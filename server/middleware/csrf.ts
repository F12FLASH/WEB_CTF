import { RequestHandler } from "express";
import crypto from "crypto";
import cookieParser from "cookie-parser";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

export const setCsrfToken: RequestHandler = (req, res, next) => {
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    const token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
  next();
};

export const verifyCsrfToken: RequestHandler = (req, res, next) => {
  const method = req.method.toUpperCase();
  
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({ 
      message: "CSRF token missing. Please refresh the page and try again." 
    });
  }

  if (cookieToken !== headerToken) {
    return res.status(403).json({ 
      message: "CSRF token validation failed. Please refresh the page and try again." 
    });
  }

  next();
};

export { cookieParser };
