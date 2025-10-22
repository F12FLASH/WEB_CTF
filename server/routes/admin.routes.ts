import { Router } from "express";
import { storage } from "../storage";
import { requireAdmin } from "../auth";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiting for admin login
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3, // Stricter limit for admin
  message: "Too many admin login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin login
router.post("/login", adminLoginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const isValid = await storage.verifyAdminPassword(username, password);
    
    if (!isValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const admin = await storage.getAdminByUsername(username);
    if (!admin) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Clear any existing user session before setting admin session
    req.session.userId = undefined;
    req.session.username = undefined;

    // Set admin session
    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;

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

// Admin logout - clear admin session only, preserve user session if exists
router.post("/logout", async (req, res) => {
  // Clear admin-specific session data
  req.session.adminId = undefined;
  req.session.adminUsername = undefined;
  
  // Save session after clearing admin data
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.json({ message: "Logout successful" });
  });
});

// Check admin session
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

// Get all challenges (with flags) - admin only
router.get("/challenges", requireAdmin, async (req, res) => {
  try {
    const challenges = await storage.getAllChallenges();
    res.json(challenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ message: "Failed to fetch challenges" });
  }
});

// Get challenge by ID (with flag) - admin only
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

// Get admin statistics
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const [challenges, players, submissions] = await Promise.all([
      storage.getAllChallenges(),
      storage.getAllPlayers(),
      storage.getAllSubmissions(),
    ]);

    // Calculate statistics
    const totalChallenges = challenges.length;
    const totalPlayers = players.length;
    const totalSubmissions = submissions.length;
    const successfulSolves = submissions.filter(s => s.isCorrect).length;
    
    // Calculate challenges by category
    const challengesByCategory = challenges.reduce((acc, challenge) => {
      acc[challenge.category] = (acc[challenge.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate challenges by difficulty
    const challengesByDifficulty = challenges.reduce((acc, challenge) => {
      acc[challenge.difficulty] = (acc[challenge.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get recent submissions (last 10)
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

export default router;
