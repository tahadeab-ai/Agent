import { eq, lte, and, desc } from 'drizzle-orm';
import { getDb } from './index';
import { users, telegramTurns, cronJobs, User, CronJob, TelegramTurn } from './schema';

export async function getUserById(userId: string): Promise<User | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error(`[DB] Error fetching user ${userId}:`, error);
    return null;
  }
}

export async function upsertUser(data: {
  id: string;
  email?: string | null;
  name?: string | null;
  type?: string;
}): Promise<User | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const existing = await getUserById(data.id);
    if (existing) {
      const updated = await db
        .update(users)
        .set({
          email: data.email !== undefined ? data.email : existing.email,
          name: data.name !== undefined ? data.name : existing.name,
          type: data.type || existing.type,
        })
        .where(eq(users.id, data.id))
        .returning();
      return updated[0] || null;
    } else {
      const inserted = await db
        .insert(users)
        .values({
          id: data.id,
          email: data.email || null,
          name: data.name || null,
          type: data.type || 'regular',
        })
        .returning();
      return inserted[0] || null;
    }
  } catch (error) {
    console.error(`[DB] Error upserting user ${data.id}:`, error);
    return null;
  }
}

export async function getUserSoul(userId: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const user = await getUserById(userId);
    return user?.soul || null;
  } catch (error) {
    console.error(`[DB] Error getting soul for user ${userId}:`, error);
    return null;
  }
}

export async function updateUserSoul(userId: string, soul: string | null): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    // Ensure user exists first
    const existing = await getUserById(userId);
    if (!existing) {
      await db.insert(users).values({
        id: userId,
        soul,
        type: 'regular',
      });
    } else {
      await db.update(users).set({ soul }).where(eq(users.id, userId));
    }
    return true;
  } catch (error) {
    console.error(`[DB] Error updating soul for user ${userId}:`, error);
    return false;
  }
}

export async function createTelegramLinkToken(
  userId: string,
  token: string,
  expiresAt: Date
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    const existing = await getUserById(userId);
    if (!existing) {
      await db.insert(users).values({
        id: userId,
        telegramLinkToken: token,
        telegramLinkTokenExpiresAt: expiresAt,
        type: 'regular',
      });
    } else {
      await db
        .update(users)
        .set({
          telegramLinkToken: token,
          telegramLinkTokenExpiresAt: expiresAt,
        })
        .where(eq(users.id, userId));
    }
    return true;
  } catch (error) {
    console.error(`[DB] Error setting telegram link token for user ${userId}:`, error);
    return false;
  }
}

export async function getUserByTelegramLinkToken(token: string): Promise<User | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.telegramLinkToken, token))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error(`[DB] Error getting user by telegram link token:`, error);
    return null;
  }
}

export async function getUserByTelegramChatId(chatId: string): Promise<User | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.telegramChatId, chatId))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error(`[DB] Error getting user by telegram chat ID ${chatId}:`, error);
    return null;
  }
}

export async function linkTelegramChat(userId: string, chatId: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await db
      .update(users)
      .set({
        telegramChatId: chatId,
        telegramLinkToken: null,
        telegramLinkTokenExpiresAt: null,
      })
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error(`[DB] Error linking telegram chat for user ${userId}:`, error);
    return false;
  }
}

export async function saveTelegramTurn(data: {
  userId: string;
  chatId: string;
  role: string;
  content: string;
}): Promise<TelegramTurn | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const id = crypto.randomUUID();
    const result = await db
      .insert(telegramTurns)
      .values({
        id,
        userId: data.userId,
        chatId: data.chatId,
        role: data.role,
        content: data.content,
      })
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error(`[DB] Error saving telegram turn:`, error);
    return null;
  }
}

export async function getTelegramTurns(chatId: string, limit = 10): Promise<TelegramTurn[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const result = await db
      .select()
      .from(telegramTurns)
      .where(eq(telegramTurns.chatId, chatId))
      .orderBy(desc(telegramTurns.createdAt))
      .limit(limit);
    return result.reverse();
  } catch (error) {
    console.error(`[DB] Error getting telegram turns for chat ${chatId}:`, error);
    return [];
  }
}

export async function getCronJobs(userId: string): Promise<CronJob[]> {
  const db = getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(cronJobs)
      .where(eq(cronJobs.userId, userId))
      .orderBy(desc(cronJobs.createdAt));
  } catch (error) {
    console.error(`[DB] Error getting cron jobs for user ${userId}:`, error);
    return [];
  }
}

export async function getCronJobById(jobId: string): Promise<CronJob | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(cronJobs).where(eq(cronJobs.id, jobId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error(`[DB] Error getting cron job ${jobId}:`, error);
    return null;
  }
}

export async function getDueCronJobs(): Promise<CronJob[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const now = new Date();
    return await db.select().from(cronJobs).where(lte(cronJobs.nextRunAt, now));
  } catch (error) {
    console.error(`[DB] Error getting due cron jobs:`, error);
    return [];
  }
}

export async function createCronJob(data: {
  userId: string;
  cronExpression: string;
  prompt: string;
  timezone?: string;
  nextRunAt: Date;
}): Promise<CronJob | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const id = crypto.randomUUID();
    const result = await db
      .insert(cronJobs)
      .values({
        id,
        userId: data.userId,
        cronExpression: data.cronExpression,
        prompt: data.prompt,
        timezone: data.timezone || 'UTC',
        nextRunAt: data.nextRunAt,
      })
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error(`[DB] Error creating cron job:`, error);
    return null;
  }
}

export async function deleteCronJob(jobId: string, userId: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await db
      .delete(cronJobs)
      .where(and(eq(cronJobs.id, jobId), eq(cronJobs.userId, userId)));
    return true;
  } catch (error) {
    console.error(`[DB] Error deleting cron job ${jobId}:`, error);
    return false;
  }
}

export async function updateCronJobRun(
  jobId: string,
  lastRunAt: Date,
  nextRunAt: Date,
  lastOutput: string
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await db
      .update(cronJobs)
      .set({
        lastRunAt,
        nextRunAt,
        lastOutput,
      })
      .where(eq(cronJobs.id, jobId));
    return true;
  } catch (error) {
    console.error(`[DB] Error updating cron job run ${jobId}:`, error);
    return false;
  }
}
