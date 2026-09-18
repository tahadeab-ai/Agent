import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email'),
  name: text('name'),
  type: text('type').default('regular').notNull(), // 'regular' | 'guest'
  soul: text('soul'),
  telegramChatId: text('telegram_chat_id'),
  telegramLinkToken: text('telegram_link_token'),
  telegramLinkTokenExpiresAt: timestamp('telegram_link_token_expires_at', { withTimezone: true }),
});

export const telegramTurns = pgTable('telegram_turns', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  chatId: text('chat_id').notNull(),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cronJobs = pgTable('cron_jobs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  cronExpression: text('cron_expression').notNull(),
  prompt: text('prompt').notNull(),
  timezone: text('timezone').default('UTC').notNull(),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }).notNull(),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  lastOutput: text('last_output'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type TelegramTurn = typeof telegramTurns.$inferSelect;
export type CronJob = typeof cronJobs.$inferSelect;
