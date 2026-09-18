import { CronExpressionParser } from 'cron-parser';
import { generateText } from 'ai';
import { CronJob } from '@/lib/db/schema';
import { getUserById, getUserSoul, updateCronJobRun } from '@/lib/db/queries';
import { getLanguageModel } from '@/lib/ai/models';
import { getAllToolsForUser } from '@/lib/ai/tools';
import { assembleSystemPrompt } from '@/lib/ai/prompts';
import { sendTelegramMessage } from '@/lib/telegram';

export async function executeCronJob(job: CronJob): Promise<{
  success: boolean;
  output: string;
  nextRunAt: Date;
}> {
  console.log(`[Cron] Executing job ${job.id} for user ${job.userId}: "${job.prompt}"`);

  const user = await getUserById(job.userId);
  const userType = user?.type || 'regular';
  const soul = await getUserSoul(job.userId);
  const tools = await getAllToolsForUser(job.userId, userType);

  const system = assembleSystemPrompt({
    soul,
    userType: userType as 'regular' | 'guest',
    hasComposio: Boolean(process.env.COMPOSIO_API_KEY && userType !== 'guest'),
    hasSupermemory: Boolean(process.env.SUPERMEMORY_API_KEY && userType !== 'guest'),
  });

  const model = getLanguageModel();

  const response = await generateText({
    model,
    system,
    prompt: `[AUTOMATED SCHEDULED TASK]\nYou are executing a scheduled automated task for the user.\nTask prompt: "${job.prompt}".\nPlease execute any necessary actions using your tools and produce a comprehensive summary of the results.`,
    tools,
    maxSteps: 5,
  });

  const output = response.text || 'Task completed without text output.';
  const lastRunAt = new Date();

  // Calculate next run time
  let nextRunAt: Date;
  try {
    const interval = CronExpressionParser.parse(job.cronExpression, {
      currentDate: lastRunAt,
      tz: job.timezone || 'UTC',
    });
    nextRunAt = interval.next().toDate();
  } catch (_err) {
    // If expression fails, default to 24 hours later
    nextRunAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  // Persist run output and next run date
  await updateCronJobRun(job.id, lastRunAt, nextRunAt, output);

  // If user has linked Telegram, notify them of the scheduled execution result!
  if (user?.telegramChatId) {
    sendTelegramMessage(
      user.telegramChatId,
      `⏰ *Scheduled Task Executed*\n\n*Prompt*: ${job.prompt}\n\n*Result*:\n${output}`
    ).catch(() => {});
  }

  return {
    success: true,
    output,
    nextRunAt,
  };
}
