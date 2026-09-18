import { NextRequest, NextResponse } from 'next/server';
import { getDueCronJobs } from '@/lib/db/queries';
import { executeCronJob } from '@/lib/cron/runner';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const expected = `Bearer ${cronSecret}`;
      if (authHeader !== expected) {
        console.warn('[Cron Tick] Unauthorized request: invalid or missing Authorization header');
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const dueJobs = await getDueCronJobs();
    console.log(`[Cron Tick] Found ${dueJobs.length} due job(s) to process.`);

    const results = [];
    for (const job of dueJobs) {
      try {
        const result = await executeCronJob(job);
        results.push({ jobId: job.id, success: true, nextRunAt: result.nextRunAt });
      } catch (err: any) {
        console.error(`[Cron Tick] Error executing job ${job.id}:`, err);
        results.push({ jobId: job.id, success: false, error: err?.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      jobs: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron Tick] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    );
  }
}
