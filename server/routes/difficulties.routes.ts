import { Router } from "express";
import { storage } from "../storage";
import { requireAdmin } from "../middleware/auth.middleware";
import { insertChallengeDifficultySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import rateLimit from "express-rate-limit";

const router = Router();

const difficultyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many difficulty requests",
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/", difficultyLimiter, async (req, res) => {
  try {
    const difficulties = await storage.getAllDifficulties();
    res.json(difficulties);
  } catch (error) {
    console.error("Error fetching difficulties:", error);
    res.status(500).json({ message: "Failed to fetch difficulties" });
  }
});

router.get("/:id", difficultyLimiter, async (req, res) => {
  try {
    const difficulty = await storage.getDifficultyById(req.params.id);
    if (!difficulty) {
      return res.status(404).json({ message: "Difficulty not found" });
    }
    res.json(difficulty);
  } catch (error) {
    console.error("Error fetching difficulty:", error);
    res.status(500).json({ message: "Failed to fetch difficulty" });
  }
});

router.post("/", requireAdmin, difficultyLimiter, async (req, res) => {
  try {
    const result = insertChallengeDifficultySchema.safeParse(req.body);
    
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ message: validationError.message });
    }

    const existingDifficulty = await storage.getDifficultyBySlug(result.data.slug);
    if (existingDifficulty) {
      return res.status(400).json({ message: "Difficulty with this slug already exists" });
    }

    const difficulty = await storage.createDifficulty(result.data);
    res.status(201).json(difficulty);
  } catch (error) {
    console.error("Error creating difficulty:", error);
    res.status(500).json({ message: "Failed to create difficulty" });
  }
});

router.put("/:id", requireAdmin, difficultyLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, color, level, sortOrder, pointsMultiplier } = req.body;

    if (slug) {
      const existingDifficulty = await storage.getDifficultyBySlug(slug);
      if (existingDifficulty && existingDifficulty.id !== id) {
        return res.status(400).json({ message: "Difficulty with this slug already exists" });
      }
    }

    const difficulty = await storage.updateDifficulty(id, {
      name,
      slug,
      description,
      color,
      level,
      sortOrder,
      pointsMultiplier,
    });

    if (!difficulty) {
      return res.status(404).json({ message: "Difficulty not found" });
    }

    res.json(difficulty);
  } catch (error) {
    console.error("Error updating difficulty:", error);
    res.status(500).json({ message: "Failed to update difficulty" });
  }
});

router.delete("/:id", requireAdmin, difficultyLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    
    const difficulty = await storage.getDifficultyById(id);
    if (!difficulty) {
      return res.status(404).json({ message: "Difficulty not found" });
    }

    const challenges = await storage.getAllChallenges();
    const hasAssociatedChallenges = challenges.some(c => c.difficultyId === difficulty.id);
    
    if (hasAssociatedChallenges) {
      return res.status(400).json({ 
        message: "Cannot delete difficulty with associated challenges. Please reassign or delete those challenges first." 
      });
    }

    const deleted = await storage.deleteDifficulty(id);
    res.json({ message: "Difficulty deleted successfully" });
  } catch (error) {
    console.error("Error deleting difficulty:", error);
    res.status(500).json({ message: "Failed to delete difficulty" });
  }
});

export default router;
