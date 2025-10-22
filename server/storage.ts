import {
  type Challenge,
  type ChallengeWithRelations,
  type InsertChallenge,
  type Player,
  type InsertPlayer,
  type Submission,
  type InsertSubmission,
  type AdminUser,
  type InsertAdminUser,
  type Announcement,
  type InsertAnnouncement,
  type Setting,
  type InsertSetting,
  type ChallengeAccessLog,
  type InsertChallengeAccessLog,
  type ChallengeCategory,
  type InsertChallengeCategory,
  type ChallengeDifficulty,
  type InsertChallengeDifficulty,
  challenges,
  players,
  submissions,
  adminUsers,
  announcements,
  settings,
  challengeAccessLogs,
  challengeCategories,
  challengeDifficulties,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { AuthService } from "./services/auth.service";

export interface IStorage {
  // Challenge methods
  getAllChallenges(): Promise<ChallengeWithRelations[]>;
  getChallengeById(id: string): Promise<ChallengeWithRelations | undefined>;
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
  getAllAdmins(): Promise<AdminUser[]>;
  createAdmin(admin: InsertAdminUser): Promise<AdminUser>;
  verifyAdminPassword(username: string, password: string): Promise<boolean>;

  // Announcement methods
  getAllAnnouncements(): Promise<Announcement[]>;
  getActiveAnnouncements(): Promise<Announcement[]>;
  getAnnouncementById(id: string): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string): Promise<boolean>;

  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string): Promise<Setting>;
  getAllSettings(): Promise<Setting[]>;
  deleteSetting(key: string): Promise<boolean>;

  // Challenge Access Log methods
  logChallengeAccess(log: InsertChallengeAccessLog): Promise<ChallengeAccessLog>;
  getChallengeAccessLogs(challengeId?: string, startDate?: Date, endDate?: Date): Promise<ChallengeAccessLog[]>;
  getAccessLogStats(): Promise<any>;

  // Challenge Category methods
  getAllCategories(): Promise<ChallengeCategory[]>;
  getCategoryById(id: string): Promise<ChallengeCategory | undefined>;
  getCategoryBySlug(slug: string): Promise<ChallengeCategory | undefined>;
  createCategory(category: InsertChallengeCategory): Promise<ChallengeCategory>;
  updateCategory(id: string, category: Partial<InsertChallengeCategory>): Promise<ChallengeCategory | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Challenge Difficulty methods
  getAllDifficulties(): Promise<ChallengeDifficulty[]>;
  getDifficultyById(id: string): Promise<ChallengeDifficulty | undefined>;
  getDifficultyBySlug(slug: string): Promise<ChallengeDifficulty | undefined>;
  createDifficulty(difficulty: InsertChallengeDifficulty): Promise<ChallengeDifficulty>;
  updateDifficulty(id: string, difficulty: Partial<InsertChallengeDifficulty>): Promise<ChallengeDifficulty | undefined>;
  deleteDifficulty(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Challenge methods
  async getAllChallenges(): Promise<ChallengeWithRelations[]> {
    const results = await db.query.challenges.findMany({
      with: {
        category: true,
        difficulty: true,
      },
    });
    return results as ChallengeWithRelations[];
  }

  async getChallengeById(id: string): Promise<ChallengeWithRelations | undefined> {
    const result = await db.query.challenges.findFirst({
      where: eq(challenges.id, id),
      with: {
        category: true,
        difficulty: true,
      },
    });
    return result as ChallengeWithRelations | undefined;
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

  async getAllAdmins(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers);
  }

  async createAdmin(insertAdmin: InsertAdminUser): Promise<AdminUser> {
    const [admin] = await db
      .insert(adminUsers)
      .values(insertAdmin)
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

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    return setting;
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(settings)
        .values({ key, value })
        .returning();
      return created;
    }
  }

  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }

  async deleteSetting(key: string): Promise<boolean> {
    await db.delete(settings).where(eq(settings.key, key));
    return true;
  }

  // Challenge Access Log methods
  async logChallengeAccess(log: InsertChallengeAccessLog): Promise<ChallengeAccessLog> {
    const [accessLog] = await db
      .insert(challengeAccessLogs)
      .values(log)
      .returning();
    return accessLog;
  }

  async getChallengeAccessLogs(
    challengeId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ChallengeAccessLog[]> {
    let query = db.select().from(challengeAccessLogs);

    const conditions = [];
    if (challengeId) {
      conditions.push(eq(challengeAccessLogs.challengeId, challengeId));
    }
    if (startDate) {
      conditions.push(gte(challengeAccessLogs.visitedAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(challengeAccessLogs.visitedAt, endDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(challengeAccessLogs.visitedAt));
  }

  async getAccessLogStats(): Promise<any> {
    const logs = await db.select().from(challengeAccessLogs);
    
    const totalViews = logs.length;
    const uniqueVisitors = new Set(logs.map(log => log.ipAddress || 'unknown')).size;
    
    const deviceStats = logs.reduce((acc, log) => {
      const device = log.deviceType || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const countryStats = logs.reduce((acc, log) => {
      const country = log.geoCountry || 'unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const challengeStats = logs.reduce((acc, log) => {
      const challengeId = log.challengeId;
      acc[challengeId] = (acc[challengeId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalViews,
      uniqueVisitors,
      deviceStats,
      countryStats,
      challengeStats,
    };
  }

  // Challenge Category methods
  async getAllCategories(): Promise<ChallengeCategory[]> {
    return await db
      .select()
      .from(challengeCategories)
      .orderBy(challengeCategories.sortOrder);
  }

  async getCategoryById(id: string): Promise<ChallengeCategory | undefined> {
    const [category] = await db
      .select()
      .from(challengeCategories)
      .where(eq(challengeCategories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<ChallengeCategory | undefined> {
    const [category] = await db
      .select()
      .from(challengeCategories)
      .where(eq(challengeCategories.slug, slug));
    return category;
  }

  async createCategory(category: InsertChallengeCategory): Promise<ChallengeCategory> {
    const [newCategory] = await db
      .insert(challengeCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(
    id: string,
    category: Partial<InsertChallengeCategory>
  ): Promise<ChallengeCategory | undefined> {
    const [updated] = await db
      .update(challengeCategories)
      .set(category)
      .where(eq(challengeCategories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db
      .delete(challengeCategories)
      .where(eq(challengeCategories.id, id))
      .returning();
    return result.length > 0;
  }

  // Challenge Difficulty methods
  async getAllDifficulties(): Promise<ChallengeDifficulty[]> {
    return await db
      .select()
      .from(challengeDifficulties)
      .orderBy(challengeDifficulties.sortOrder);
  }

  async getDifficultyById(id: string): Promise<ChallengeDifficulty | undefined> {
    const [difficulty] = await db
      .select()
      .from(challengeDifficulties)
      .where(eq(challengeDifficulties.id, id));
    return difficulty;
  }

  async getDifficultyBySlug(slug: string): Promise<ChallengeDifficulty | undefined> {
    const [difficulty] = await db
      .select()
      .from(challengeDifficulties)
      .where(eq(challengeDifficulties.slug, slug));
    return difficulty;
  }

  async createDifficulty(difficulty: InsertChallengeDifficulty): Promise<ChallengeDifficulty> {
    const [newDifficulty] = await db
      .insert(challengeDifficulties)
      .values(difficulty)
      .returning();
    return newDifficulty;
  }

  async updateDifficulty(
    id: string,
    difficulty: Partial<InsertChallengeDifficulty>
  ): Promise<ChallengeDifficulty | undefined> {
    const [updated] = await db
      .update(challengeDifficulties)
      .set(difficulty)
      .where(eq(challengeDifficulties.id, id))
      .returning();
    return updated;
  }

  async deleteDifficulty(id: string): Promise<boolean> {
    const result = await db
      .delete(challengeDifficulties)
      .where(eq(challengeDifficulties.id, id))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
