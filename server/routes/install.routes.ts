import { Router } from "express";
import { storage } from "../storage";
import { AuthService } from "../services/auth.service";
import rateLimit from "express-rate-limit";

const router = Router();

const installLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many install attempts",
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/check", installLimiter, async (req, res) => {
  try {
    const adminUsers = await storage.getAllAdmins();
    const needsSetup = adminUsers.length === 0;
    
    res.json({
      needsSetup,
      hasDatabase: true,
    });
  } catch (error) {
    console.error("Install check error:", error);
    res.status(500).json({ 
      message: "Failed to check installation status",
      needsSetup: true,
      hasDatabase: false,
    });
  }
});

router.post("/setup", installLimiter, async (req, res) => {
  try {
    const adminUsers = await storage.getAllAdmins();
    if (adminUsers.length > 0) {
      return res.status(400).json({ 
        message: "System already set up. Admin users exist." 
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        message: "Username and password are required" 
      });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ 
        message: "Username must be between 3 and 50 characters" 
      });
    }

    const passwordValidation = AuthService.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        message: passwordValidation.message 
      });
    }

    const admin = await storage.createAdmin({
      username,
      passwordHash: await AuthService.hashPassword(password),
    });

    res.json({
      message: "Installation completed successfully",
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error("Install setup error:", error);
    res.status(500).json({ message: "Failed to complete installation" });
  }
});

export default router;
