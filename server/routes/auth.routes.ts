import { Router } from "express";
import { storage } from "../storage";
import { registerUserSchema, loginUserSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import rateLimit from "express-rate-limit";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, async (req, res) => {
  try {
    const result = registerUserSchema.safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ message: validationError.message });
    }

    const { username, email, password } = result.data;

    const existingUsername = await storage.getPlayerByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const existingEmail = await storage.getPlayerByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await storage.createPlayer({
      username,
      email,
      passwordHash: password,
    });

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) return reject(err);
        
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.adminId = undefined;
        req.session.adminUsername = undefined;
        
        req.session.save((saveErr) => {
          if (saveErr) return reject(saveErr);
          resolve();
        });
      });
    });

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

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) return reject(err);
        
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.adminId = undefined;
        req.session.adminUsername = undefined;
        
        req.session.save((saveErr) => {
          if (saveErr) return reject(saveErr);
          resolve();
        });
      });
    });

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
