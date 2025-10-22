import { Router } from "express";
import { storage } from "../storage";
import { insertChallengeSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { requireAdmin, requireUser } from "../auth";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiting for flag submissions
const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: "Too many submission attempts, please slow down",
  standardHeaders: true,
  legacyHeaders: false,
});

// Get all challenges (without flags)
router.get("/", async (req, res) => {
  try {
    const challenges = await storage.getAllChallenges();
    // Remove flags from response for security
    const safeChallenges = challenges.map(({ flag, ...rest }) => rest);
    res.json(safeChallenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ message: "Failed to fetch challenges" });
  }
});

// Get challenge by ID (without flag)
router.get("/:id", async (req, res) => {
  try {
    const challenge = await storage.getChallengeById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    // Remove flag from response
    const { flag, ...safeChallenge } = challenge;
    res.json(safeChallenge);
  } catch (error) {
    console.error("Error fetching challenge:", error);
    res.status(500).json({ message: "Failed to fetch challenge" });
  }
});

// Submit flag (requires authentication)
router.post("/:id/submit", requireUser, submissionLimiter, async (req, res) => {
  try {
    const challengeId = req.params.id;
    const { flag } = req.body;
    const userId = req.session.userId!;

    // Validate input
    if (!flag) {
      return res.status(400).json({ message: "Flag is required" });
    }

    const challenge = await storage.getChallengeById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Get current user
    const player = await storage.getPlayerById(userId);
    if (!player) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already solved
    const submissions = await storage.getPlayerSubmissions(player.id);
    const alreadySolved = submissions.some(
      (sub) => sub.challengeId === challengeId && sub.isCorrect === 1
    );

    if (alreadySolved) {
      return res.json({
        correct: true,
        message: "You've already solved this challenge",
      });
    }

    // Check if flag is correct
    const submittedFlag = flag.trim();
    const expectedFlag = challenge.flag.trim();
    const isCorrect = submittedFlag === expectedFlag;

    // Create submission
    await storage.createSubmission({
      playerId: player.id,
      challengeId: challengeId,
      submittedFlag: flag,
      isCorrect: isCorrect ? 1 : 0,
    });

    // Update player score if correct
    if (isCorrect) {
      const newScore = player.score + challenge.points;
      await storage.updatePlayerScore(player.id, newScore);
    }

    res.json({
      correct: isCorrect,
      message: isCorrect
        ? `Correct! You earned ${challenge.points} points`
        : "Incorrect flag. Try again!",
    });
  } catch (error) {
    console.error("Error submitting flag:", error);
    res.status(500).json({ message: "Failed to submit flag" });
  }
});

// Create challenge (admin only)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const result = insertChallengeSchema.safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ message: validationError.message });
    }

    const challenge = await storage.createChallenge(result.data);
    res.status(201).json(challenge);
  } catch (error) {
    console.error("Error creating challenge:", error);
    res.status(500).json({ message: "Failed to create challenge" });
  }
});

// Update challenge (admin only)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const result = insertChallengeSchema.safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ message: validationError.message });
    }

    const challenge = await storage.updateChallenge(req.params.id, result.data);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    res.json(challenge);
  } catch (error) {
    console.error("Error updating challenge:", error);
    res.status(500).json({ message: "Failed to update challenge" });
  }
});

// Delete challenge (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const success = await storage.deleteChallenge(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    res.json({ message: "Challenge deleted successfully" });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    res.status(500).json({ message: "Failed to delete challenge" });
  }
});

export default router;
