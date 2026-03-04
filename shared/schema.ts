import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
});

export const authSession = pgTable("auth_session", {
  id: serial("id").primaryKey(),
  sessionString: text("session_string").notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  url: true,
});

export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;
export type AuthSession = typeof authSession.$inferSelect;
export type Setting = typeof settings.$inferSelect;
