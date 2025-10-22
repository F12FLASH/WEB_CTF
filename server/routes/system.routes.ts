import { Router } from "express";
import { requireAdmin } from "../auth";
import { storage } from "../storage";
import { db } from "../db";
import { sql, eq } from "drizzle-orm";
import * as fs from "fs/promises";
import * as path from "path";
import { exportLimiter } from "../middleware/rateLimiter";
import { 
  players, 
  submissions, 
  challengeCategories, 
  challengeDifficulties, 
  challenges, 
  announcements, 
  settings 
} from "@shared/schema";

const router = Router();

router.get("/info", requireAdmin, async (req, res) => {
  try {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(process.cwd(), "package.json"), "utf-8")
    );

    const dbVersion = await db.execute(sql`SELECT version()`);
    
    const [
      challenges,
      players,
      categories,
      difficulties,
      submissions,
      announcements,
    ] = await Promise.all([
      storage.getAllChallenges(),
      storage.getAllPlayers(),
      storage.getAllCategories(),
      storage.getAllDifficulties(),
      storage.getAllSubmissions(),
      storage.getAllAnnouncements(),
    ]);

    res.json({
      version: packageJson.version,
      name: packageJson.name,
      nodeVersion: process.version,
      platform: process.platform,
      databaseVersion: dbVersion.rows[0]?.version || "Unknown",
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      database: {
        challenges: challenges.length,
        players: players.length,
        categories: categories.length,
        difficulties: difficulties.length,
        submissions: submissions.length,
        announcements: announcements.length,
      },
    });
  } catch (error) {
    console.error("Error fetching system info:", error);
    res.status(500).json({ message: "Failed to fetch system information" });
  }
});

router.post("/export/json", requireAdmin, exportLimiter, async (req, res) => {
  try {
    const [
      challenges,
      players,
      categories,
      difficulties,
      submissions,
      announcements,
      settings,
    ] = await Promise.all([
      storage.getAllChallenges(),
      storage.getAllPlayers(),
      storage.getAllCategories(),
      storage.getAllDifficulties(),
      storage.getAllSubmissions(),
      storage.getAllAnnouncements(),
      storage.getAllSettings(),
    ]);

    const exportData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      data: {
        challenges,
        players,
        categories,
        difficulties,
        submissions,
        announcements,
        settings,
      },
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ctf-backup-${Date.now()}.json"`
    );
    res.json(exportData);
  } catch (error) {
    console.error("Error exporting database to JSON:", error);
    res.status(500).json({ message: "Failed to export database" });
  }
});

router.post("/export/sql", requireAdmin, exportLimiter, async (req, res) => {
  try {
    const tables = [
      "admin_users",
      "challenge_categories",
      "challenge_difficulties",
      "challenges",
      "players",
      "submissions",
      "announcements",
      "settings",
      "analytics",
    ];

    let sqlDump = `-- CTF Platform Database Export\n`;
    sqlDump += `-- Export Date: ${new Date().toISOString()}\n\n`;
    sqlDump += `-- Disable foreign key checks during import\n`;
    sqlDump += `SET session_replication_role = 'replica';\n\n`;

    for (const table of tables) {
      const result = await db.execute(sql.raw(`SELECT * FROM ${table}`));
      
      if (result.rows.length > 0) {
        sqlDump += `-- Table: ${table}\n`;
        sqlDump += `TRUNCATE TABLE ${table} CASCADE;\n`;
        
        const columns = Object.keys(result.rows[0]);
        
        for (const row of result.rows) {
          const values = columns.map((col) => {
            const value = row[col];
            if (value === null) return "NULL";
            if (typeof value === "string") {
              return `'${value.replace(/'/g, "''")}'`;
            }
            if (typeof value === "boolean") return value ? "true" : "false";
            if (value instanceof Date) return `'${value.toISOString()}'`;
            return String(value);
          });
          
          sqlDump += `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")});\n`;
        }
        
        sqlDump += `\n`;
      }
    }

    sqlDump += `-- Re-enable foreign key checks\n`;
    sqlDump += `SET session_replication_role = 'origin';\n`;

    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ctf-backup-${Date.now()}.sql"`
    );
    res.send(sqlDump);
  } catch (error) {
    console.error("Error exporting database to SQL:", error);
    res.status(500).json({ message: "Failed to export database" });
  }
});

router.post("/import/json", requireAdmin, exportLimiter, async (req, res) => {
  try {
    const { data, overwrite } = req.body;

    if (!data || typeof data !== "object") {
      return res.status(400).json({ message: "Invalid import data" });
    }

    if (!data.version || !data.data) {
      return res.status(400).json({ message: "Invalid backup format" });
    }

    const importData = data.data;
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    await db.transaction(async (tx) => {
      if (importData.categories && Array.isArray(importData.categories)) {
        for (const category of importData.categories) {
          try {
            if (overwrite) {
              await tx.insert(challengeCategories)
                .values(category)
                .onConflictDoUpdate({
                  target: challengeCategories.id,
                  set: {
                    name: category.name,
                    slug: category.slug,
                    description: category.description,
                    color: category.color,
                    icon: category.icon,
                  },
                });
              imported++;
            } else {
              const result = await tx.insert(challengeCategories)
                .values(category)
                .onConflictDoNothing();
              if (result.rowCount && result.rowCount > 0) {
                imported++;
              } else {
                skipped++;
              }
            }
          } catch (error) {
            errors.push(`Category ${category.name}: ${error}`);
            throw error;
          }
        }
      }

      if (importData.difficulties && Array.isArray(importData.difficulties)) {
        for (const difficulty of importData.difficulties) {
          try {
            if (overwrite) {
              await tx.insert(challengeDifficulties)
                .values(difficulty)
                .onConflictDoUpdate({
                  target: challengeDifficulties.id,
                  set: {
                    name: difficulty.name,
                    slug: difficulty.slug,
                    description: difficulty.description,
                    color: difficulty.color,
                    level: difficulty.level,
                  },
                });
              imported++;
            } else {
              const result = await tx.insert(challengeDifficulties)
                .values(difficulty)
                .onConflictDoNothing();
              if (result.rowCount && result.rowCount > 0) {
                imported++;
              } else {
                skipped++;
              }
            }
          } catch (error) {
            errors.push(`Difficulty ${difficulty.name}: ${error}`);
            throw error;
          }
        }
      }

      if (importData.challenges && Array.isArray(importData.challenges)) {
        for (const challenge of importData.challenges) {
          try {
            if (overwrite) {
              await tx.insert(challenges)
                .values(challenge)
                .onConflictDoUpdate({
                  target: challenges.id,
                  set: {
                    title: challenge.title,
                    description: challenge.description,
                    categoryId: challenge.categoryId,
                    difficultyId: challenge.difficultyId,
                    points: challenge.points,
                    flag: challenge.flag,
                  },
                });
              imported++;
            } else {
              const result = await tx.insert(challenges)
                .values(challenge)
                .onConflictDoNothing();
              if (result.rowCount && result.rowCount > 0) {
                imported++;
              } else {
                skipped++;
              }
            }
          } catch (error) {
            errors.push(`Challenge ${challenge.title}: ${error}`);
            throw error;
          }
        }
      }

      if (importData.players && Array.isArray(importData.players)) {
        for (const player of importData.players) {
          try {
            if (overwrite) {
              await tx.insert(players)
                .values(player)
                .onConflictDoUpdate({
                  target: players.id,
                  set: {
                    username: player.username,
                    email: player.email,
                    score: player.score,
                    passwordHash: player.passwordHash,
                  },
                });
              imported++;
            } else {
              const result = await tx.insert(players)
                .values(player)
                .onConflictDoNothing();
              if (result.rowCount && result.rowCount > 0) {
                imported++;
              } else {
                skipped++;
              }
            }
          } catch (error) {
            errors.push(`Player ${player.username}: ${error}`);
            throw error;
          }
        }
      }

      if (importData.submissions && Array.isArray(importData.submissions)) {
        for (const submission of importData.submissions) {
          try {
            if (overwrite) {
              await tx.insert(submissions)
                .values(submission)
                .onConflictDoUpdate({
                  target: submissions.id,
                  set: {
                    playerId: submission.playerId,
                    challengeId: submission.challengeId,
                    submittedFlag: submission.submittedFlag,
                    isCorrect: submission.isCorrect,
                    timestamp: submission.timestamp,
                  },
                });
              imported++;
            } else {
              const result = await tx.insert(submissions)
                .values(submission)
                .onConflictDoNothing();
              if (result.rowCount && result.rowCount > 0) {
                imported++;
              } else {
                skipped++;
              }
            }
          } catch (error) {
            errors.push(`Submission ${submission.id}: ${error}`);
            throw error;
          }
        }
      }

      if (importData.announcements && Array.isArray(importData.announcements)) {
        for (const announcement of importData.announcements) {
          try {
            if (overwrite) {
              await tx.insert(announcements)
                .values(announcement)
                .onConflictDoUpdate({
                  target: announcements.id,
                  set: {
                    title: announcement.title,
                    message: announcement.message,
                    type: announcement.type,
                    isActive: announcement.isActive,
                    createdBy: announcement.createdBy,
                    createdAt: announcement.createdAt,
                  },
                });
              imported++;
            } else {
              const result = await tx.insert(announcements)
                .values(announcement)
                .onConflictDoNothing();
              if (result.rowCount && result.rowCount > 0) {
                imported++;
              } else {
                skipped++;
              }
            }
          } catch (error) {
            errors.push(`Announcement ${announcement.title}: ${error}`);
            throw error;
          }
        }
      }

      if (importData.settings && Array.isArray(importData.settings)) {
        for (const setting of importData.settings) {
          try {
            if (overwrite) {
              await tx.insert(settings)
                .values(setting)
                .onConflictDoUpdate({
                  target: settings.key,
                  set: {
                    value: setting.value,
                  },
                });
              imported++;
            } else {
              const result = await tx.insert(settings)
                .values(setting)
                .onConflictDoNothing();
              if (result.rowCount && result.rowCount > 0) {
                imported++;
              } else {
                skipped++;
              }
            }
          } catch (error) {
            errors.push(`Setting ${setting.key}: ${error}`);
            throw error;
          }
        }
      }

      if (errors.length > 0) {
        throw new Error(`Import failed with ${errors.length} errors: ${errors.join(", ")}`);
      }
    });

    res.json({
      message: "Import completed",
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error importing JSON data:", error);
    res.status(500).json({ message: "Failed to import data: " + (error as Error).message });
  }
});

router.post("/import/sql", requireAdmin, exportLimiter, async (req, res) => {
  try {
    const { sql: sqlContent } = req.body;

    if (!sqlContent || typeof sqlContent !== "string") {
      return res.status(400).json({ message: "SQL content is required" });
    }

    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("SET"));

    let executed = 0;
    const errors: string[] = [];

    await db.transaction(async (tx) => {
      for (const statement of statements) {
        try {
          await tx.execute(sql.raw(statement));
          executed++;
        } catch (error) {
          const errorMsg = (error as Error).message;
          errors.push(`Statement failed: ${errorMsg}`);
          throw error;
        }
      }
    });

    res.json({
      message: "SQL import completed",
      executed,
      total: statements.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error importing SQL:", error);
    res.status(500).json({ 
      message: "Failed to import SQL (rolled back): " + (error as Error).message 
    });
  }
});

export default router;
