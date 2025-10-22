import { Router } from "express";
import { storage } from "../storage";
import { registerUserSchema, loginUserSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiting for login/register attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// User registration
router.post("/register", authLimiter, async (req, res) => {
  try {
    const result = registerUserSchema.safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ message: validationError.message });
    }

    const { username, email, password } = result.data;

    // Check if username or email already exists
    const existingUsername = await storage.getPlayerByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const existingEmail = await storage.getPlayerByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create user
    const user = await storage.createPlayer({
      username,
      email,
      passwordHash: password, // Will be hashed in storage layer
    });

    // Clear any existing admin session before setting user session
    req.session.adminId = undefined;
    req.session.adminUsername = undefined;

    // Set user session
    req.session.userId = user.id;
    req.session.username = user.username;

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        score: user.score,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to register" });
  }
});

// User login
router.post("/login", authLimiter, async (req, res) => {
  try {
    const result = loginUserSchema.safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ message: validationError.message });
    }

    const { username, password } = result.data;

    const isValid = await storage.verifyPlayerPassword(username, password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = await storage.getPlayerByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Clear any existing admin session before setting user session
    req.session.adminId = undefined;
    req.session.adminUsername = undefined;

    // Set user session
    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        score: user.score,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to login" });
  }
});

// User logout - clear user session only, preserve admin session if exists
router.post("/logout", async (req, res) => {
  // Clear user-specific session data
  req.session.userId = undefined;
  req.session.username = undefined;
  
  // Save session after clearing user data
  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.json({ message: "Logout successful" });
  });
});

// Get current user
router.get("/user", async (req, res) => {
  if (req.session && req.session.userId) {
    try {
      const user = await storage.getPlayerById(req.session.userId);
      if (user) {
        res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          score: user.score,
        });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

export default router;
