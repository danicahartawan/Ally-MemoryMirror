import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Profiles (patients)
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  avatarInitials: text("avatar_initials").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
});

// Photos
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  name: text("name").notNull(),
  relationship: text("relationship"),
  imageBase64: text("image_base64").notNull(),
  memoryNotes: text("memory_notes"),
  place: text("place"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
});

// Game Sessions
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  correctAnswers: integer("correct_answers").default(0),
  totalQuestions: integer("total_questions").default(0),
  avgEegAttention: integer("avg_eeg_attention").default(0),
  avgEegRelaxation: integer("avg_eeg_relaxation").default(0),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  startedAt: true,
  endedAt: true,
  correctAnswers: true,
  totalQuestions: true,
  avgEegAttention: true,
  avgEegRelaxation: true,
});

// Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  photoId: integer("photo_id"),
  sessionId: integer("session_id"),
  content: text("content").notNull(),
  sender: text("sender").notNull(), // 'ai' or 'user'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// EEG Readings (Mock data for simulation)
export const eegReadings = pgTable("eeg_readings", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  sessionId: integer("session_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  attention: integer("attention").notNull(),
  relaxation: integer("relaxation").notNull(),
  stress: integer("stress").notNull(),
  recognition: integer("recognition").notNull(),
});

export const insertEegReadingSchema = createInsertSchema(eegReadings).omit({
  id: true,
  timestamp: true,
});

// Bandit Game Sessions
export const banditGameSessions = pgTable("bandit_game_sessions", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  totalTrials: integer("total_trials").default(0),
  optimalChoices: integer("optimal_choices").default(0),
  explorationRate: integer("exploration_rate").default(0), // 0-100
  learningRate: integer("learning_rate").default(0), // 0-100
  avgResponseTime: integer("avg_response_time").default(0), // in milliseconds
  eegCorrelation: integer("eeg_correlation").default(0), // 0-100
});

export const insertBanditGameSessionSchema = createInsertSchema(banditGameSessions).omit({
  id: true,
  startedAt: true,
  endedAt: true,
  totalTrials: true,
  optimalChoices: true,
  explorationRate: true,
  learningRate: true,
  avgResponseTime: true,
  eegCorrelation: true,
});

// Bandit Game Trials
export const banditGameTrials = pgTable("bandit_game_trials", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  trialNumber: integer("trial_number").notNull(),
  choice: integer("choice").notNull(), // 0, 1, or 2
  reward: integer("reward").notNull(), // reward received
  responseTime: integer("response_time").notNull(), // in milliseconds
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertBanditGameTrialSchema = createInsertSchema(banditGameTrials).omit({
  id: true,
  timestamp: true,
});

// EEG Cognitive Profile (ML analysis results)
export const eegCognitiveProfiles = pgTable("eeg_cognitive_profiles", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  alzheimersLikelihood: integer("alzheimers_likelihood").notNull(), // percentage 0-100
  attentionScore: integer("attention_score").notNull(), // 0-100
  memoryScore: integer("memory_score").notNull(), // 0-100
  cognitiveControl: integer("cognitive_control").notNull(), // 0-100
  fatigueLevel: integer("fatigue_level").notNull(), // 0-100
  dataPoints: integer("data_points").notNull(), // number of EEG readings used
  featureImportance: json("feature_importance"), // JSON of feature importance
});

export const insertEegCognitiveProfileSchema = createInsertSchema(eegCognitiveProfiles).omit({
  id: true,
  timestamp: true,
});

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type EegReading = typeof eegReadings.$inferSelect;
export type InsertEegReading = z.infer<typeof insertEegReadingSchema>;

export type BanditGameSession = typeof banditGameSessions.$inferSelect;
export type InsertBanditGameSession = z.infer<typeof insertBanditGameSessionSchema>;

export type BanditGameTrial = typeof banditGameTrials.$inferSelect;
export type InsertBanditGameTrial = z.infer<typeof insertBanditGameTrialSchema>;

export type EegCognitiveProfile = typeof eegCognitiveProfiles.$inferSelect;
export type InsertEegCognitiveProfile = z.infer<typeof insertEegCognitiveProfileSchema>;
