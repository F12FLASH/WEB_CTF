import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Challenge categories lookup table
export const challengeCategories = pgTable("challenge_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenge difficulties lookup table
export const challengeDifficulties = pgTable("challenge_difficulties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  pointsMultiplier: integer("points_multiplier").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: varchar("category_id").notNull().references(() => challengeCategories.id),
  difficultyId: varchar("difficulty_id").notNull().references(() => challengeDifficulties.id),
  points: integer("points").notNull(),
  flag: text("flag").notNull(),
});

// Users/Players table - CTF participants who can register, login, and submit flags
export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  score: integer("score").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull(),
  challengeId: varchar("challenge_id").notNull(),
  submittedFlag: text("submitted_flag").notNull(),
  isCorrect: integer("is_correct").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Admin users table for secure admin authentication
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Session storage table for admin authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Announcements table for admin notifications
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

// Settings table for system configuration
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Challenge access logs table for analytics
export const challengeAccessLogs = pgTable(
  "challenge_access_logs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    challengeId: varchar("challenge_id").notNull(),
    playerId: varchar("player_id"),
    visitedAt: timestamp("visited_at").notNull().defaultNow(),
    userAgent: text("user_agent"),
    deviceType: text("device_type"),
    ipAddress: text("ip_address"),
    geoCountry: text("geo_country"),
    geoRegion: text("geo_region"),
    geoCity: text("geo_city"),
    referrer: text("referrer"),
  },
  (table) => [
    index("IDX_access_logs_challenge_visited").on(table.challengeId, table.visitedAt),
  ],
);

// Relations
export const challengesRelations = relations(challenges, ({ one }) => ({
  category: one(challengeCategories, {
    fields: [challenges.categoryId],
    references: [challengeCategories.id],
  }),
  difficulty: one(challengeDifficulties, {
    fields: [challenges.difficultyId],
    references: [challengeDifficulties.id],
  }),
}));

export const challengeCategoriesRelations = relations(challengeCategories, ({ many }) => ({
  challenges: many(challenges),
}));

export const challengeDifficultiesRelations = relations(challengeDifficulties, ({ many }) => ({
  challenges: many(challenges),
}));

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  score: true,
  createdAt: true,
});

// Registration schema with strong password validation
export const registerUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username too long"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// Login schema
export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Admin login schema with strict validation
export const loginAdminSchema = z.object({
  username: z.string().min(1, "Username is required").max(100),
  password: z.string().min(1, "Password is required").max(200),
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  timestamp: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertChallengeAccessLogSchema = createInsertSchema(challengeAccessLogs).omit({
  id: true,
  visitedAt: true,
});

export const insertChallengeCategorySchema = createInsertSchema(challengeCategories).omit({
  id: true,
  createdAt: true,
});

export const insertChallengeDifficultySchema = createInsertSchema(challengeDifficulties).omit({
  id: true,
  createdAt: true,
});

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;

// Extended challenge type with full category and difficulty data
export type ChallengeWithRelations = Challenge & {
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
};

export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type LoginAdmin = z.infer<typeof loginAdminSchema>;

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type ChallengeAccessLog = typeof challengeAccessLogs.$inferSelect;
export type InsertChallengeAccessLog = z.infer<typeof insertChallengeAccessLogSchema>;

export type ChallengeCategory = typeof challengeCategories.$inferSelect;
export type InsertChallengeCategory = z.infer<typeof insertChallengeCategorySchema>;

export type ChallengeDifficulty = typeof challengeDifficulties.$inferSelect;
export type InsertChallengeDifficulty = z.infer<typeof insertChallengeDifficultySchema>;
