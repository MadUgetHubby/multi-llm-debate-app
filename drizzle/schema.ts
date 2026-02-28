import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Debates table: stores each user inquiry and its metadata
 */
export const debates = mysqlTable("debates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  inquiry: text("inquiry").notNull(),
  topic: varchar("topic", { length: 255 }),
  numberOfRounds: int("numberOfRounds").default(2).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).default("pending").notNull(),
  finalSynthesis: text("finalSynthesis"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Debate = typeof debates.$inferSelect;
export type InsertDebate = typeof debates.$inferInsert;

/**
 * Debate rounds table: stores each round of the debate
 */
export const debateRounds = mysqlTable("debateRounds", {
  id: int("id").autoincrement().primaryKey(),
  debateId: int("debateId").notNull(),
  roundNumber: int("roundNumber").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DebateRound = typeof debateRounds.$inferSelect;
export type InsertDebateRound = typeof debateRounds.$inferInsert;

/**
 * Debate messages table: stores individual agent responses and critiques
 */
export const debateMessages = mysqlTable("debateMessages", {
  id: int("id").autoincrement().primaryKey(),
  debateId: int("debateId").notNull(),
  roundNumber: int("roundNumber").notNull(),
  agentName: varchar("agentName", { length: 100 }).notNull(), // e.g., "Strategist", "Creative", "Critic"
  agentPersona: varchar("agentPersona", { length: 255 }),
  messageType: mysqlEnum("messageType", ["initial_response", "critique", "refined_response"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DebateMessage = typeof debateMessages.$inferSelect;
export type InsertDebateMessage = typeof debateMessages.$inferInsert;

/**
 * Debate metrics table: stores metrics for each debate
 */
export const debateMetrics = mysqlTable("debateMetrics", {
  id: int("id").autoincrement().primaryKey(),
  debateId: int("debateId").notNull(),
  convergenceSpeed: decimal("convergenceSpeed", { precision: 5, scale: 2 }), // rounds to convergence
  agentAgreementRate: decimal("agentAgreementRate", { precision: 5, scale: 2 }), // percentage (0-100)
  qualityImprovement: decimal("qualityImprovement", { precision: 5, scale: 2 }), // percentage improvement
  averageResponseLength: int("averageResponseLength"), // average tokens/characters
  debateComplexity: varchar("debateComplexity", { length: 50 }), // simple, moderate, complex
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DebateMetric = typeof debateMetrics.$inferSelect;
export type InsertDebateMetric = typeof debateMetrics.$inferInsert;

/**
 * Debate settings table: stores user preferences for debate configuration
 */
export const debateSettings = mysqlTable("debateSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  defaultNumberOfRounds: int("defaultNumberOfRounds").default(2).notNull(),
  enableEmailNotifications: boolean("enableEmailNotifications").default(true).notNull(),
  agentPersonas: text("agentPersonas"), // JSON array of agent configurations
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DebateSetting = typeof debateSettings.$inferSelect;
export type InsertDebateSetting = typeof debateSettings.$inferInsert;
