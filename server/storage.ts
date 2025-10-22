import {
  type Challenge,
  type InsertChallenge,
  type Player,
  type InsertPlayer,
  type Submission,
  type InsertSubmission,
  type AdminUser,
  type InsertAdminUser,
  type Announcement,
  type InsertAnnouncement,
  challenges,
  players,
  submissions,
  adminUsers,
  announcements,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { AuthService } from "./services/auth.service";

export interface IStorage {
  // Challenge methods
  getAllChallenges(): Promise<Challenge[]>;
  getChallengeById(id: string): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: string, challenge: InsertChallenge): Promise<Challenge | undefined>;
  deleteChallenge(id: string): Promise<boolean>;

  // Player/User methods (for CTF participants)
  getPlayerById(id: string): Promise<Player | undefined>;
  getPlayerByUsername(username: string): Promise<Player | undefined>;
  getPlayerByEmail(email: string): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayerScore(playerId: string, newScore: number): Promise<void>;
  getAllPlayers(): Promise<Player[]>;
  verifyPlayerPassword(username: string, password: string): Promise<boolean>;

  // Submission methods
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getPlayerSubmissions(playerId: string): Promise<Submission[]>;
  getAllSubmissions(): Promise<Submission[]>;

  // Admin methods
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  createAdmin(admin: InsertAdminUser): Promise<AdminUser>;
  verifyAdminPassword(username: string, password: string): Promise<boolean>;

  // Announcement methods
  getAllAnnouncements(): Promise<Announcement[]>;
  getActiveAnnouncements(): Promise<Announcement[]>;
  getAnnouncementById(id: string): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
      // Check if we already have data
      const existingChallenges = await db.select().from(challenges).limit(1);
      if (existingChallenges.length > 0) {
        return; // Data already exists
      }

      // Create sample challenges
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
      ];

      for (const challenge of sampleChallenges) {
        await db.insert(challenges).values(challenge);
      }

      console.log("Sample data initialized successfully");
      console.log("⚠️  No admin user created. Run 'npx tsx server/scripts/init-admin.ts' to create an admin user.");
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }

  // Challenge methods
  async getAllChallenges(): Promise<Challenge[]> {
    return await db.select().from(challenges);
  }

  async getChallengeById(id: string): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const [challenge] = await db
      .insert(challenges)
      .values(insertChallenge)
      .returning();
    return challenge;
  }

  async updateChallenge(
    id: string,
    insertChallenge: InsertChallenge
  ): Promise<Challenge | undefined> {
    const [challenge] = await db
      .update(challenges)
      .set(insertChallenge)
      .where(eq(challenges.id, id))
      .returning();
    return challenge;
  }

  async deleteChallenge(id: string): Promise<boolean> {
    const result = await db.delete(challenges).where(eq(challenges.id, id)).returning();
    return result.length > 0;
  }

  // Player/User methods (for CTF participants)
  async getPlayerById(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player;
  }

  async getPlayerByUsername(username: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.username, username));
    return player;
  }

  async getPlayerByEmail(email: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.email, email));
    return player;
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    // Hash password before storing using AuthService (12 rounds)
    const passwordHash = await AuthService.hashPassword(insertPlayer.passwordHash);
    const [player] = await db
      .insert(players)
      .values({
        ...insertPlayer,
        passwordHash,
      })
      .returning();
    return player;
  }

  async updatePlayerScore(playerId: string, newScore: number): Promise<void> {
    await db
      .update(players)
      .set({ score: newScore })
      .where(eq(players.id, playerId));
  }

  async getAllPlayers(): Promise<Player[]> {
    return await db.select().from(players);
  }

  async verifyPlayerPassword(username: string, password: string): Promise<boolean> {
    const player = await this.getPlayerByUsername(username);
    if (!player) {
      return false;
    }
    return await AuthService.verifyPassword(password, player.passwordHash);
  }

  // Submission methods
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db
      .insert(submissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async getPlayerSubmissions(playerId: string): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.playerId, playerId));
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return await db.select().from(submissions);
  }

  // Admin methods
  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username));
    return admin;
  }

  async createAdmin(insertAdmin: InsertAdminUser): Promise<AdminUser> {
    // Hash password using AuthService (12 rounds)
    const passwordHash = await AuthService.hashPassword(insertAdmin.passwordHash);
    const [admin] = await db
      .insert(adminUsers)
      .values({
        ...insertAdmin,
        passwordHash,
      })
      .returning();
    return admin;
  }

  async verifyAdminPassword(username: string, password: string): Promise<boolean> {
    const admin = await this.getAdminByUsername(username);
    if (!admin) {
      return false;
    }
    return await AuthService.verifyPassword(password, admin.passwordHash);
  }

  // Announcement methods
  async getAllAnnouncements(): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .orderBy(announcements.createdAt);
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .where(eq(announcements.isActive, 1))
      .orderBy(announcements.createdAt);
  }

  async getAnnouncementById(id: string): Promise<Announcement | undefined> {
    const [announcement] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, id));
    return announcement;
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db
      .insert(announcements)
      .values(insertAnnouncement)
      .returning();
    return announcement;
  }

  async updateAnnouncement(
    id: string,
    updateData: Partial<InsertAnnouncement>
  ): Promise<Announcement | undefined> {
    const [announcement] = await db
      .update(announcements)
      .set(updateData)
      .where(eq(announcements.id, id))
      .returning();
    return announcement;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const result = await db
      .delete(announcements)
      .where(eq(announcements.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
