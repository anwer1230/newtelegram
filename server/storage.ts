import { db } from "./db";
import {
  groups,
  authSession,
  settings,
  type Group,
  type InsertGroup,
  type AuthSession,
  type Setting
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Groups
  getGroups(): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  deleteGroup(id: number): Promise<void>;

  // Session
  getSession(): Promise<AuthSession | undefined>;
  saveSession(sessionString: string): Promise<void>;
  clearSession(): Promise<void>;

  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string): Promise<Setting>;
}

export class DatabaseStorage implements IStorage {
  async getGroups(): Promise<Group[]> {
    return await db.select().from(groups);
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const [group] = await db.insert(groups).values(insertGroup).returning();
    return group;
  }

  async deleteGroup(id: number): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }

  async getSession(): Promise<AuthSession | undefined> {
    const [session] = await db.select().from(authSession).limit(1);
    return session;
  }

  async saveSession(sessionString: string): Promise<void> {
    await db.delete(authSession); // clear old session
    await db.insert(authSession).values({ sessionString });
  }

  async clearSession(): Promise<void> {
    await db.delete(authSession);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    const [existing] = await db.select().from(settings).where(eq(settings.key, key));
    if (existing) {
      const [updated] = await db.update(settings).set({ value }).where(eq(settings.key, key)).returning();
      return updated;
    } else {
      const [inserted] = await db.insert(settings).values({ key, value }).returning();
      return inserted;
    }
  }
}

export const storage = new DatabaseStorage();
