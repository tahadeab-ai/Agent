import { tool } from 'ai';
import { z } from 'zod';
import { updateUserSoul, createCronJob, getCronJobs, deleteCronJob } from '@/lib/db/queries';
import { CronExpressionParser } from 'cron-parser';

export function parseNaturalScheduleToCron(input: string): string {
  const normalized = input.trim().toLowerCase();

  // If already a 5-part cron expression
  const cronRegex = /^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})$/;
  if (cronRegex.test(normalized)) {
    return normalized;
  }

  // Common patterns
  if (normalized.includes('every hour') || normalized === 'hourly') {
    return '0 * * * *';
  }

  // Every day at X am/pm
  const dailyTimeMatch = normalized.match(/every\s+day\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (dailyTimeMatch) {
    let hour = parseInt(dailyTimeMatch[1], 10);
    const minute = dailyTimeMatch[2] ? parseInt(dailyTimeMatch[2], 10) : 0;
    const meridiem = dailyTimeMatch[3];

    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;

    return `${minute} ${hour} * * *`;
  }

  // Every [weekday] at X am/pm
  const weekdays: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };

  for (const [dayName, dayNum] of Object.entries(weekdays)) {
    if (normalized.includes(dayName)) {
      const timeMatch = normalized.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      let hour = 9;
      let minute = 0;
      if (timeMatch && timeMatch[1]) {
        hour = parseInt(timeMatch[1], 10);
        minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const meridiem = timeMatch[3];
        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
      }
      return `${minute} ${hour} * * ${dayNum}`;
    }
  }

  // Default fallback for daily
  return '0 9 * * *';
}

export function getLocalTools(userId: string) {
  return {
    setSoul: tool({
      description:
        'Save the personalized agent personality (Soul) for the user. Takes a markdown string describing the agent voice, tone, rules, and preferences gathered during onboarding.',
      parameters: z.object({
        soul: z
          .string()
          .describe('The complete markdown content defining the agent soul and personality.'),
      }),
      execute: async ({ soul }: { soul: string }) => {
        try {
          const success = await updateUserSoul(userId, soul);
          if (success) {
            return {
              success: true,
              message: 'Agent soul successfully updated and applied for all future chats.',
            };
          }
          return {
            success: false,
            message: 'Failed to update agent soul in database.',
          };
        } catch (error: any) {
          return {
            success: false,
            error: error?.message || 'Failed to update agent soul',
          };
        }
      },
    }),

    scheduleTask: tool({
      description:
        'Schedule a recurring task for the agent to execute in the background. Accepts a natural language schedule (e.g. "every day at 9am", "every Monday at 8am") or a cron expression, and the prompt/instructions to execute.',
      parameters: z.object({
        prompt: z
          .string()
          .describe('The prompt or instruction for the agent to perform on each trigger.'),
        schedule: z
          .string()
          .describe(
            'The schedule expression, e.g. "every day at 9am", "every hour", or a standard cron expression "0 9 * * *".'
          ),
        timezone: z
          .string()
          .optional()
          .default('UTC')
          .describe('The timezone for the schedule (default: UTC).'),
      }),
      execute: async ({
        prompt,
        schedule,
        timezone = 'UTC',
      }: {
        prompt: string;
        schedule: string;
        timezone?: string;
      }) => {
        try {
          const cronExpression = parseNaturalScheduleToCron(schedule);
          const interval = CronExpressionParser.parse(cronExpression, { tz: timezone });
          const nextRunAt = interval.next().toDate();

          const job = await createCronJob({
            userId,
            cronExpression,
            prompt,
            timezone,
            nextRunAt,
          });

          if (!job) {
            return {
              success: false,
              message: 'Failed to save scheduled task to database.',
            };
          }

          return {
            success: true,
            jobId: job.id,
            cronExpression,
            nextRunAt: nextRunAt.toISOString(),
            message: `Task successfully scheduled! Next run scheduled for ${nextRunAt.toUTCString()} (cron: ${cronExpression}).`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error?.message || 'Failed to parse schedule or create cron job.',
          };
        }
      },
    }),

    listMySchedules: tool({
      description: 'List all active scheduled cron tasks for the current user.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const jobs = await getCronJobs(userId);
          return {
            success: true,
            count: jobs.length,
            jobs: jobs.map((j) => ({
              id: j.id,
              prompt: j.prompt,
              cronExpression: j.cronExpression,
              timezone: j.timezone,
              nextRunAt: j.nextRunAt.toISOString(),
              lastRunAt: j.lastRunAt?.toISOString() || null,
              lastOutput: j.lastOutput || null,
            })),
          };
        } catch (error: any) {
          return {
            success: false,
            error: error?.message || 'Failed to fetch scheduled tasks.',
          };
        }
      },
    }),

    cancelSchedule: tool({
      description: 'Cancel and delete a scheduled task by its Job ID.',
      parameters: z.object({
        jobId: z.string().describe('The ID of the scheduled job to cancel.'),
      }),
      execute: async ({ jobId }: { jobId: string }) => {
        try {
          const success = await deleteCronJob(jobId, userId);
          if (success) {
            return {
              success: true,
              message: `Scheduled task ${jobId} successfully canceled.`,
            };
          }
          return {
            success: false,
            message: `Task not found or could not be deleted.`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error?.message || 'Failed to cancel scheduled task.',
          };
        }
      },
    }),
  };
}
