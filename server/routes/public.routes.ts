import { Router } from "express";
import { storage } from "../storage";
import { requireUser } from "../auth";

const router = Router();

router.get("/site-info", async (req, res) => {
  try {
    const settings = await storage.getAllSettings();
    const siteInfo = settings.reduce((acc, setting) => {
      if (setting.key === 'site_name' || setting.key === 'site_description') {
        acc[setting.key] = setting.value;
      }
      return acc;
    }, {} as Record<string, string>);

    res.json({
      siteName: siteInfo.site_name || "CTF Platform",
      siteDescription: siteInfo.site_description || "Capture The Flag Platform",
    });
  } catch (error) {
    console.error("Error fetching site info:", error);
    res.json({
      siteName: "CTF Platform",
      siteDescription: "Capture The Flag Platform",
    });
  }
});

// Universal logout - destroys entire session (both admin and user)
router.post("/logout", async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.json({ message: "Logout successful" });
  });
});

// Get solved challenges for current user
router.get("/solved", requireUser, async (req, res) => {
  try {
    const userId = req.session.userId!;

    const submissions = await storage.getPlayerSubmissions(userId);
    const solvedChallengeIds = submissions
      .filter((sub) => sub.isCorrect === 1)
      .map((sub) => sub.challengeId)
      .filter((id, index, self) => self.indexOf(id) === index); // unique

    res.json(solvedChallengeIds);
  } catch (error) {
    console.error("Error fetching solved challenges:", error);
    res.status(500).json({ message: "Failed to fetch solved challenges" });
  }
});

// Get leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const players = await storage.getAllPlayers();
    const submissions = await storage.getAllSubmissions();

    // Calculate solved count for each player
    const leaderboard = players.map((player) => {
      const playerSubmissions = submissions.filter(
        (sub) => sub.playerId === player.id && sub.isCorrect === 1
      );
      const uniqueSolvedChallenges = new Set(
        playerSubmissions.map((sub) => sub.challengeId)
      );

      return {
        playerId: player.id,
        username: player.username,
        score: player.score,
        solvedCount: uniqueSolvedChallenges.size,
      };
    });

    // Sort by score (descending) and add rank
    leaderboard.sort((a, b) => b.score - a.score);
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    res.json(rankedLeaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

export default router;
