import { db } from "./db";
import {
  groups,
  authSession,
  type Group,
  type InsertGroup,
  type AuthSession
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
}

export const storage = new DatabaseStorage();
