import { db } from "../db";
import { challenges, players, submissions, adminUsers, announcements } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

async function backupDatabase() {
  try {
    console.log("🔄 Starting database backup...");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(process.cwd(), "backups");
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const [allChallenges, allPlayers, allSubmissions, allAdmins, allAnnouncements] = await Promise.all([
      db.select().from(challenges),
      db.select().from(players),
      db.select().from(submissions),
      db.select().from(adminUsers),
      db.select().from(announcements),
    ]);

    const backup = {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      data: {
        challenges: allChallenges,
        players: allPlayers,
        submissions: allSubmissions,
        adminUsers: allAdmins.map(admin => ({
          ...admin,
          passwordHash: "[REDACTED]"
        })),
        announcements: allAnnouncements,
      },
      stats: {
        totalChallenges: allChallenges.length,
        totalPlayers: allPlayers.length,
        totalSubmissions: allSubmissions.length,
        totalAdmins: allAdmins.length,
        totalAnnouncements: allAnnouncements.length,
      },
    };

    const backupFile = path.join(backupDir, `ctf-backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log(`✅ Backup successful: ${backupFile}`);
    console.log(`📊 Stats:`, backup.stats);

    return backupFile;
  } catch (error) {
    console.error("❌ Backup failed:", error);
    process.exit(1);
  }
}

backupDatabase()
  .then(() => {
    console.log("✅ Backup completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Backup error:", error);
    process.exit(1);
  });
