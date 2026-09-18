import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { getCronJobs, deleteCronJob } from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await getCurrentSession();
    const jobs = await getCronJobs(session.user.id);
    return NextResponse.json({ jobs });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('id');

    if (!jobId) {
      return NextResponse.json({ error: 'id query parameter required' }, { status: 400 });
    }

    const success = await deleteCronJob(jobId, session.user.id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
