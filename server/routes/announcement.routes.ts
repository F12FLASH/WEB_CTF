import { Router } from "express";
import { storage } from "../storage";
import { insertAnnouncementSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { requireAdmin } from "../auth";

const router = Router();

// Public route - Get active announcements
router.get("/", async (req, res) => {
  try {
    const announcements = await storage.getActiveAnnouncements();
    res.json(announcements);
  } catch (error) {
    console.error("Error fetching active announcements:", error);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

// Admin routes - Manage announcements
router.get("/all", requireAdmin, async (req, res) => {
  try {
    const announcements = await storage.getAllAnnouncements();
    res.json(announcements);
  } catch (error) {
    console.error("Error fetching all announcements:", error);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const adminId = req.session.adminId!;
    
    const result = insertAnnouncementSchema.safeParse({
      ...req.body,
      createdBy: adminId,
    });
    
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ message: validationError.message });
    }

    const announcement = await storage.createAnnouncement(result.data);
    res.status(201).json(announcement);
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ message: "Failed to create announcement" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, type, isActive } = req.body;

    const announcement = await storage.updateAnnouncement(id, {
      title,
      message,
      type,
      isActive,
    });

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json(announcement);
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({ message: "Failed to update announcement" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteAnnouncement(id);
    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({ message: "Failed to delete announcement" });
  }
});

export default router;
