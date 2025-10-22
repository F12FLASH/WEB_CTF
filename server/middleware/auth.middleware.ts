import { Request, Response, NextFunction } from "express";
import { InstallService } from "../services/install.service";

export async function requireAdminOnlyAfterInstall(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const systemCheck = await InstallService.checkSystem();
    
    if (systemCheck.isInstalled && !req.session?.adminId) {
      return res.status(403).json({
        message: "Access denied. System is installed. Admin authentication required."
      });
    }
    
    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Authentication check failed" });
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.session?.adminId) {
    return res.status(403).json({
      message: "Admin authentication required"
    });
  }
  next();
}
