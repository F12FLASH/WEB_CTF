import type { Request, Response, NextFunction } from "express";
import DOMPurify from "isomorphic-dompurify";

export function sanitizeInputs(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }
  
  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query);
  }
  
  next();
}

function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = DOMPurify.sanitize(obj[key], {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
      });
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

export function validateNoSqlInjection(input: string): boolean {
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
  ];
  
  return !sqlInjectionPatterns.some(pattern => pattern.test(input));
}

export function validateInput(req: Request, res: Response, next: NextFunction) {
  const checkForInjection = (obj: any): boolean => {
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        if (!validateNoSqlInjection(obj[key])) {
          return false;
        }
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        if (!checkForInjection(obj[key])) {
          return false;
        }
      }
    }
    return true;
  };
  
  if (req.body && !checkForInjection(req.body)) {
    return res.status(400).json({ message: "Invalid input detected" });
  }
  
  if (req.query && !checkForInjection(req.query)) {
    return res.status(400).json({ message: "Invalid query parameters" });
  }
  
  next();
}
