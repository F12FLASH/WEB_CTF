import { Router } from "express";
import { storage } from "../storage";
import { requireAdmin } from "../middleware/auth.middleware";
import { insertChallengeAccessLogSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import rateLimit from "express-rate-limit";

const router = Router();

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many analytics requests",
  standardHeaders: true,
  legacyHeaders: false,
});

function detectDeviceType(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

router.post("/challenge-access", analyticsLimiter, async (req, res) => {
  try {
    const { challengeId, playerId } = req.body;
    
    if (!challengeId) {
      return res.status(400).json({ message: "Challenge ID is required" });
    }

    const userAgent = req.headers['user-agent'] || '';
    const deviceType = detectDeviceType(userAgent);
    const ipAddress = (req.headers['x-forwarded-for'] as string || req.ip || '').split(',')[0].trim();
    const referrer = req.headers['referer'] || req.headers['referrer'] || '';

    const logData = {
      challengeId,
      playerId: playerId || null,
      userAgent,
      deviceType,
      ipAddress,
      referrer: referrer as string,
      geoCountry: null,
      geoRegion: null,
      geoCity: null,
    };

    const result = insertChallengeAccessLogSchema.safeParse(logData);
    
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ message: validationError.message });
    }

    await storage.logChallengeAccess(result.data);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error logging challenge access:", error);
    res.status(500).json({ message: "Failed to log challenge access" });
  }
});

router.get("/challenge-access", requireAdmin, async (req, res) => {
  try {
    const { challengeId, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const logs = await storage.getChallengeAccessLogs(
      challengeId as string | undefined,
      start,
      end
    );

    res.json(logs);
  } catch (error) {
    console.error("Error fetching challenge access logs:", error);
    res.status(500).json({ message: "Failed to fetch access logs" });
  }
});

router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const stats = await storage.getAccessLogStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching analytics stats:", error);
    res.status(500).json({ message: "Failed to fetch analytics stats" });
  }
});

export default router;
