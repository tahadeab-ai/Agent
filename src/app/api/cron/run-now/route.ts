import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { getCronJobById } from '@/lib/db/queries';
import { executeCronJob } from '@/lib/cron/runner';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const job = await getCronJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Ownership check
    if (job.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await executeCronJob(job);

    return NextResponse.json({
      success: true,
      jobId,
      output: result.output,
      nextRunAt: result.nextRunAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[API/Cron/Run-Now] Error running job:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to execute job' },
      { status: 500 }
    );
  }
}
