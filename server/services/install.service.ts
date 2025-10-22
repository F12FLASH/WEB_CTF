import { storage } from "../storage";
import { AuthService } from "./auth.service";
import { db, pool } from "../db";
import { challenges, submissions, announcements, players, adminUsers, sessions, settings } from "@shared/schema";
import type { InsertChallenge, InsertAnnouncement } from "@shared/schema";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface SystemCheck {
  hasDatabase: boolean;
  databaseConnected: boolean;
  hasSessionSecret: boolean;
  hasDatabaseUrl: boolean;
  isInstalled: boolean;
  schemaReady: boolean;
  adminCount: number;
  challengeCount: number;
  playerCount: number;
  errors: string[];
  warnings: string[];
}

export interface InstallConfig {
  adminUsername: string;
  adminPassword: string;
  siteName?: string;
  siteDescription?: string;
}

export class InstallService {
  private static bootstrapAttempted = false;

  static async bootstrapDatabase(): Promise<{ success: boolean; message: string }> {
    if (this.bootstrapAttempted) {
      return { success: true, message: "Bootstrap already attempted" };
    }

    try {
      console.log("🔧 Bootstrapping database schema...");
      
      const { stdout, stderr } = await execAsync("npx drizzle-kit push");
      
      if (stderr && !stderr.includes("No schema changes")) {
        console.log("⚠️ Drizzle stderr:", stderr);
      }
      
      this.bootstrapAttempted = true;
      console.log("✅ Database schema bootstrapped successfully");
      return { success: true, message: "Schema created successfully" };
    } catch (error: any) {
      console.error("❌ Bootstrap error:", error);
      this.bootstrapAttempted = false;
      return { 
        success: false, 
        message: `Failed to bootstrap schema: ${error.message}` 
      };
    }
  }

  static async checkTablesExist(): Promise<boolean> {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'admin_users'
        );
      `);
      return result.rows[0].exists;
    } catch (error) {
      return false;
    }
  }

  static async checkSystem(): Promise<SystemCheck> {
    const checks: SystemCheck = {
      hasDatabase: false,
      databaseConnected: false,
      hasSessionSecret: !!process.env.SESSION_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      isInstalled: false,
      schemaReady: false,
      adminCount: 0,
      challengeCount: 0,
      playerCount: 0,
      errors: [],
      warnings: [],
    };

    if (!checks.hasDatabaseUrl) {
      checks.errors.push("DATABASE_URL environment variable is not set");
      return checks;
    }

    if (!checks.hasSessionSecret) {
      checks.errors.push("SESSION_SECRET environment variable is not set");
      return checks;
    }

    try {
      await pool.query("SELECT 1");
      checks.databaseConnected = true;
      checks.hasDatabase = true;
    } catch (error: any) {
      checks.errors.push(`Database connection failed: ${error.message}`);
      checks.databaseConnected = false;
      return checks;
    }

    const tablesExist = await this.checkTablesExist();
    
    if (!tablesExist) {
      checks.warnings.push("Database schema not initialized. Will bootstrap automatically.");
      
      const bootstrap = await this.bootstrapDatabase();
      if (!bootstrap.success) {
        checks.errors.push(bootstrap.message);
        return checks;
      }
    }

    checks.schemaReady = true;

    try {
      const admins = await storage.getAllAdmins();
      checks.adminCount = admins.length;
      checks.isInstalled = admins.length > 0;

      const challengesCount = await db.query.challenges.findMany();
      checks.challengeCount = challengesCount.length;

      const playersCount = await db.query.players.findMany();
      checks.playerCount = playersCount.length;
    } catch (error: any) {
      checks.errors.push(`Database query error: ${error.message}`);
    }

    return checks;
  }

  static async performInstall(config: InstallConfig, sessionId?: string): Promise<{ 
    success: boolean; 
    message: string;
    adminId?: string;
  }> {
    try {
      const systemCheck = await this.checkSystem();

      if (systemCheck.isInstalled) {
        return { success: false, message: "System is already installed" };
      }

      if (!systemCheck.databaseConnected) {
        return { success: false, message: "Database connection failed" };
      }

      if (!systemCheck.schemaReady) {
        return { success: false, message: "Database schema is not ready" };
      }

      const passwordValidation = AuthService.validatePasswordStrength(config.adminPassword);
      if (!passwordValidation.valid) {
        return { success: false, message: passwordValidation.message || "Password validation failed" };
      }

      const admin = await storage.createAdmin({
        username: config.adminUsername,
        passwordHash: await AuthService.hashPassword(config.adminPassword),
      });

      await storage.setSetting("site_name", config.siteName || "CTF Platform");
      await storage.setSetting("site_description", config.siteDescription || "Capture The Flag Platform");
      await storage.setSetting("installed_at", new Date().toISOString());
      await storage.setSetting("install_version", "1.0.0");

      if (systemCheck.challengeCount === 0) {
        await this.seedDemoData();
      }

      console.log("✅ Installation completed successfully. Admin ID:", admin.id);

      return { 
        success: true, 
        message: "Installation completed successfully",
        adminId: admin.id
      };
    } catch (error: any) {
      console.error("Installation error:", error);
      return { success: false, message: error.message || "Installation failed" };
    }
  }

  static async seedDemoData(): Promise<void> {
    const sampleChallenges: InsertChallenge[] = [
      {
        title: "SQL Injection Basics",
        description: "Find the hidden flag in this vulnerable login page. The application doesn't properly sanitize user input. Try using common SQL injection techniques to bypass authentication.\n\nURL: http://vulnerable-app.ctf/login\nHint: Think about how you can manipulate the SQL query.",
        category: "web",
        difficulty: "easy",
        points: 100,
        flag: "flag{sql_1nj3ct10n_1s_d4ng3r0us}",
      },
      {
        title: "Caesar's Secret",
        description: "An ancient encryption method was used to hide this message:\n\nGSVH R ORPV XIBKGLTIZKSR\n\nThe key is somewhere between 1 and 25. Can you decode it?",
        category: "crypto",
        difficulty: "easy",
        points: 150,
        flag: "flag{i_like_cryptography}",
      },
      {
        title: "Hidden in Plain Sight",
        description: "We intercepted this image file. Our analysts believe there's hidden data embedded within it. Can you extract the secret?\n\nDownload: secret_image.png (Simulated - Flag hidden in metadata)\n\nTools you might need: exiftool, strings, binwalk",
        category: "forensics",
        difficulty: "medium",
        points: 250,
        flag: "flag{st3g4n0gr4phy_m4st3r}",
      },
      {
        title: "Buffer Overflow 101",
        description: "This program has a classic buffer overflow vulnerability. Exploit it to gain control of the execution flow and retrieve the flag.\n\n```c\n#include <stdio.h>\n#include <string.h>\n\nvoid secret() {\n    printf(\"Flag: flag{buff3r_0v3rfl0w_pwn3d}\\n\");\n}\n\nint main() {\n    char buffer[64];\n    gets(buffer);\n    return 0;\n}\n```",
        category: "binary",
        difficulty: "hard",
        points: 400,
        flag: "flag{buff3r_0v3rfl0w_pwn3d}",
      },
      {
        title: "XSS Playground",
        description: "This web application reflects user input without proper sanitization. Craft an XSS payload that will execute JavaScript and reveal the flag stored in a cookie.\n\nURL: http://xss-challenge.ctf/search\nCookie name: secret_flag",
        category: "web",
        difficulty: "medium",
        points: 200,
        flag: "flag{xss_c4n_b3_d4ng3r0us}",
      },
      {
        title: "RSA Weakness",
        description: "We captured this RSA encrypted message along with the public key. The key size seems suspiciously small...\n\nn = 84823428793\ne = 65537\nc = 27856425893\n\nCan you decrypt it?",
        category: "crypto",
        difficulty: "hard",
        points: 350,
        flag: "flag{sm4ll_k3y_br0k3n}",
      },
      {
        title: "Memory Corruption",
        description: "This binary has a use-after-free vulnerability. Can you exploit it to read the flag from memory?\n\nDownload: vulnerable_binary (Simulated)\n\nThe flag is stored at address 0x08048000",
        category: "binary",
        difficulty: "hard",
        points: 450,
        flag: "flag{m3m0ry_l34k_pwn}",
      },
      {
        title: "Directory Traversal",
        description: "This web server allows file downloads but doesn't validate the filename properly. Can you read the flag file?\n\nURL: http://fileserver.ctf/download?file=document.pdf\nFlag location: /etc/ctf_flag.txt",
        category: "web",
        difficulty: "medium",
        points: 300,
        flag: "flag{p4th_tr4v3rs4l_vuln}",
      },
      {
        title: "JWT Confusion",
        description: "This application uses JWT for authentication. The implementation has a critical flaw in how it validates tokens. Can you forge an admin token?\n\nURL: http://jwt-app.ctf/api\nHint: Check the algorithm field",
        category: "web",
        difficulty: "hard",
        points: 400,
        flag: "flag{jwt_4lg_c0nfus10n}",
      },
      {
        title: "Weak Hashing",
        description: "We found a password hash in a database dump:\n\n5f4dcc3b5aa765d61d8327deb882cf99\n\nCan you crack it and submit the flag?\nFlag format: flag{cracked_password}",
        category: "crypto",
        difficulty: "easy",
        points: 100,
        flag: "flag{password}",
      },
      {
        title: "Command Injection",
        description: "This ping utility doesn't sanitize user input properly. Can you inject commands to read the flag?\n\nURL: http://ping.ctf/check?host=google.com\nFlag location: /home/ctf/flag.txt",
        category: "web",
        difficulty: "medium",
        points: 250,
        flag: "flag{c0mm4nd_1nj3ct10n}",
      },
      {
        title: "Reverse Engineering Challenge",
        description: "This program checks if your input is correct and reveals the flag. Can you reverse engineer the algorithm?\n\nDownload: crackme (Simulated)\nHint: The flag is XORed with a key",
        category: "reverse",
        difficulty: "hard",
        points: 400,
        flag: "flag{r3v3rs3_m3_1f_y0u_c4n}",
      },
    ];

    const sampleAnnouncements: InsertAnnouncement[] = [
      {
        title: "Welcome to CTF Platform!",
        message: "Thank you for joining our CTF competition. Read the rules carefully and have fun hacking!",
        type: "info",
        isActive: 1,
        createdBy: "system",
      },
      {
        title: "Competition Rules",
        message: "1. No DDoS attacks\n2. No sharing flags\n3. No automated tools without permission\n4. Report bugs responsibly",
        type: "warning",
        isActive: 1,
        createdBy: "system",
      },
      {
        title: "New Challenges Added!",
        message: "We've added 3 new challenges in the Reverse Engineering category. Check them out!",
        type: "success",
        isActive: 1,
        createdBy: "system",
      },
    ];

    for (const challenge of sampleChallenges) {
      await storage.createChallenge(challenge);
    }

    for (const announcement of sampleAnnouncements) {
      await storage.createAnnouncement(announcement);
    }

    console.log("✅ Demo data seeded successfully (12 challenges, 3 announcements)");
    console.log("ℹ️  Note: No demo players created. Players must register through the website.");
  }

  static async resetDemoData(): Promise<void> {
    await db.delete(challenges);
    await db.delete(submissions);
    await db.delete(announcements);
    
    await this.seedDemoData();
  }

  static async getSystemHealth(): Promise<any> {
    const checks = await this.checkSystem();
    const settings = await storage.getAllSettings();

    return {
      ...checks,
      settings: settings.reduce((acc: any, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {}),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
      },
    };
  }
}
