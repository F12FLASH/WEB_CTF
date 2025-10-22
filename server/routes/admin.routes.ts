import { Router } from "express";
import { storage } from "../storage";
import { requireAdmin } from "../auth";
import { loginAdminSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import rateLimit from "express-rate-limit";

const router = Router();

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Too many admin login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", adminLoginLimiter, async (req, res) => {
  try {
    const result = loginAdminSchema.safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ message: validationError.message });
    }

    const { username, password } = result.data;

    const isValid = await storage.verifyAdminPassword(username, password);
    
    if (!isValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const admin = await storage.getAdminByUsername(username);
    if (!admin) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) return reject(err);
        
        req.session.adminId = admin.id;
        req.session.adminUsername = admin.username;
        req.session.userId = undefined;
        req.session.username = undefined;
        
        req.session.save((saveErr) => {
          if (saveErr) return reject(saveErr);
          resolve();
        });
      });
    });

    res.json({ 
      message: "Login successful",
      admin: {
        id: admin.id,
        username: admin.username,
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Failed to login" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) return reject(err);
        res.clearCookie('connect.sid');
        resolve();
      });
    });
    
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Failed to logout" });
  }
});

router.get("/session", async (req, res) => {
  if (req.session && req.session.adminId) {
    res.json({
      authenticated: true,
      admin: {
        id: req.session.adminId,
        username: req.session.adminUsername,
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

router.get("/challenges", requireAdmin, async (req, res) => {
  try {
    const challenges = await storage.getAllChallenges();
    res.json(challenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ message: "Failed to fetch challenges" });
  }
});

router.get("/challenges/:id", requireAdmin, async (req, res) => {
  try {
    const challenge = await storage.getChallengeById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    res.json(challenge);
  } catch (error) {
    console.error("Error fetching challenge:", error);
    res.status(500).json({ message: "Failed to fetch challenge" });
  }
});

router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const [challenges, players, submissions] = await Promise.all([
      storage.getAllChallenges(),
      storage.getAllPlayers(),
      storage.getAllSubmissions(),
    ]);

    const totalChallenges = challenges.length;
    const totalPlayers = players.length;
    const totalSubmissions = submissions.length;
    const successfulSolves = submissions.filter(s => s.isCorrect).length;
    
    const challengesByCategory = challenges.reduce((acc, challenge) => {
      acc[challenge.category] = (acc[challenge.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const challengesByDifficulty = challenges.reduce((acc, challenge) => {
      acc[challenge.difficulty] = (acc[challenge.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentSubmissions = submissions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    res.json({
      totalChallenges,
      totalPlayers,
      totalSubmissions,
      successfulSolves,
      challengesByCategory,
      challengesByDifficulty,
      recentSubmissions,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

router.get("/settings", requireAdmin, async (req, res) => {
  try {
    const settings = await storage.getAllSettings();
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
    res.json(settingsMap);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

router.put("/settings", requireAdmin, async (req, res) => {
  try {
    const settingsData = req.body;
    
    if (typeof settingsData !== 'object' || settingsData === null) {
      return res.status(400).json({ message: "Invalid settings data" });
    }

    const updatePromises = Object.entries(settingsData).map(([key, value]) =>
      storage.setSetting(key, String(value))
    );

    await Promise.all(updatePromises);
    
    const updatedSettings = await storage.getAllSettings();
    const settingsMap = updatedSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    res.json(settingsMap);
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

export default router;
