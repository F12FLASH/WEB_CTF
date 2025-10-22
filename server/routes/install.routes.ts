import { Router } from "express";
import { InstallService } from "../services/install.service";
import { requireAdminOnlyAfterInstall, requireAdmin } from "../middleware/auth.middleware";
import rateLimit from "express-rate-limit";

const router = Router();

const installLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many install attempts",
  standardHeaders: true,
  legacyHeaders: false,
});

const maintenanceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many maintenance requests",
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/system-check", requireAdminOnlyAfterInstall, installLimiter, async (req, res) => {
  try {
    const systemCheck = await InstallService.checkSystem();
    res.json(systemCheck);
  } catch (error: any) {
    console.error("System check error:", error);
    res.status(500).json({ 
      message: "Failed to check system status",
      error: error.message 
    });
  }
});

router.get("/check", requireAdminOnlyAfterInstall, installLimiter, async (req, res) => {
  try {
    const systemCheck = await InstallService.checkSystem();
    
    res.json({
      needsSetup: !systemCheck.isInstalled,
      hasDatabase: systemCheck.hasDatabase,
      databaseConnected: systemCheck.databaseConnected,
      errors: systemCheck.errors,
    });
  } catch (error: any) {
    console.error("Install check error:", error);
    res.status(500).json({ 
      message: "Failed to check installation status",
      needsSetup: true,
      hasDatabase: false,
      errors: [error.message],
    });
  }
});

router.post("/setup", installLimiter, async (req, res) => {
  try {
    const systemCheck = await InstallService.checkSystem();

    if (systemCheck.isInstalled) {
      return res.status(400).json({ 
        success: false,
        message: "System is already installed" 
      });
    }

    const { adminUsername, adminPassword, siteName, siteDescription } = req.body;

    if (!adminUsername || !adminPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Admin username and password are required" 
      });
    }

    if (adminUsername.length < 3 || adminUsername.length > 50) {
      return res.status(400).json({ 
        success: false,
        message: "Admin username must be between 3 and 50 characters" 
      });
    }

    const result = await InstallService.performInstall({
      adminUsername,
      adminPassword,
      siteName,
      siteDescription,
    });

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error: any) {
    console.error("Install setup error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to complete installation",
      error: error.message 
    });
  }
});

router.get("/health", requireAdmin, maintenanceLimiter, async (req, res) => {
  try {
    const health = await InstallService.getSystemHealth();
    res.json(health);
  } catch (error: any) {
    console.error("Health check error:", error);
    res.status(500).json({ 
      message: "Failed to get system health",
      error: error.message 
    });
  }
});

router.post("/seed-demo", requireAdmin, maintenanceLimiter, async (req, res) => {
  try {
    await InstallService.seedDemoData();
    res.json({ 
      success: true,
      message: "Demo data seeded successfully" 
    });
  } catch (error: any) {
    console.error("Seed demo data error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to seed demo data",
      error: error.message 
    });
  }
});

router.post("/reset-demo", requireAdmin, maintenanceLimiter, async (req, res) => {
  try {
    await InstallService.resetDemoData();
    res.json({ 
      success: true,
      message: "Demo data reset successfully" 
    });
  } catch (error: any) {
    console.error("Reset demo data error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to reset demo data",
      error: error.message 
    });
  }
});

export default router;
