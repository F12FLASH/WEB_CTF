import { Router } from "express";
import { storage } from "../storage";
import { requireAdmin } from "../middleware/auth.middleware";
import { insertChallengeCategorySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import rateLimit from "express-rate-limit";

const router = Router();

const categoryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many category requests",
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/", categoryLimiter, async (req, res) => {
  try {
    const categories = await storage.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

router.get("/:id", categoryLimiter, async (req, res) => {
  try {
    const category = await storage.getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ message: "Failed to fetch category" });
  }
});

router.post("/", requireAdmin, categoryLimiter, async (req, res) => {
  try {
    const result = insertChallengeCategorySchema.safeParse(req.body);
    
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ message: validationError.message });
    }

    const existingCategory = await storage.getCategoryBySlug(result.data.slug);
    if (existingCategory) {
      return res.status(400).json({ message: "Category with this slug already exists" });
    }

    const category = await storage.createCategory(result.data);
    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Failed to create category" });
  }
});

router.put("/:id", requireAdmin, categoryLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, color, icon, sortOrder } = req.body;

    if (slug) {
      const existingCategory = await storage.getCategoryBySlug(slug);
      if (existingCategory && existingCategory.id !== id) {
        return res.status(400).json({ message: "Category with this slug already exists" });
      }
    }

    const category = await storage.updateCategory(id, {
      name,
      slug,
      description,
      color,
      icon,
      sortOrder,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Failed to update category" });
  }
});

router.delete("/:id", requireAdmin, categoryLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await storage.getCategoryById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const challenges = await storage.getAllChallenges();
    const hasAssociatedChallenges = challenges.some(c => c.categoryId === category.id);
    
    if (hasAssociatedChallenges) {
      return res.status(400).json({ 
        message: "Cannot delete category with associated challenges. Please reassign or delete those challenges first." 
      });
    }

    const deleted = await storage.deleteCategory(id);
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Failed to delete category" });
  }
});

export default router;
