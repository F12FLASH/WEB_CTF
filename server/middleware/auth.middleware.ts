import { Request, Response, NextFunction } from "express";
import { InstallService } from "../services/install.service";

export async function requireAdminOnlyAfterInstall(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const systemCheck = await InstallService.checkSystem();
    
    if (systemCheck.isInstalled) {
      // After installation, only allow admin access
      if (req.session?.userId && !req.session?.adminId) {
        // Regular users cannot access install page after setup
        return res.status(403).json({
          message: "Trang cài đặt chỉ dành cho quản trị viên. Hệ thống đã được cài đặt."
        });
      }
      // Admin can still access, or if not logged in, continue (will show completion)
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
