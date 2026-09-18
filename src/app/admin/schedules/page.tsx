'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Play,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  FileText,
  Info,
} from 'lucide-react';

interface CronJobItem {
  id: string;
  userId: string;
  cronExpression: string;
  prompt: string;
  timezone: string;
  nextRunAt: string;
  lastRunAt: string | null;
  lastOutput: string | null;
  createdAt: string;
}

export default function SchedulesAdminPage() {
  const [loading, setLoading] = useState(true);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<CronJobItem[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchJobs = () => {
    setLoading(true);
    fetch('/api/schedules')
      .then((res) => res.json())
      .then((data) => {
        if (data.jobs) setJobs(data.jobs);
      })
      .catch((err) => {
        setNotification({ type: 'error', text: 'Failed to load schedules: ' + err.message });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleRunNow = async (jobId: string) => {
    setRunningJobId(jobId);
    setNotification(null);
    try {
      const res = await fetch('/api/cron/run-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          text: `Job executed successfully! Output recorded. Next run: ${new Date(data.nextRunAt).toLocaleString()}`,
        });
        fetchJobs();
      } else {
        setNotification({ type: 'error', text: data.error || 'Failed to execute job.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setRunningJobId(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled task?')) return;

    setDeletingJobId(jobId);
    try {
      const res = await fetch(`/api/schedules?id=${jobId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
        setNotification({ type: 'success', text: 'Scheduled task deleted.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    } finally {
      setDeletingJobId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-purple-400" />
            Scheduled Agent Tasks (Vercel Cron)
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Automated recurring background jobs managed by your agent and triggered via Vercel Cron.
          </p>
        </div>

        <button
          onClick={fetchJobs}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {notification && (
        <div
          className={`flex items-center gap-2 rounded-xl p-4 text-xs font-medium border ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
              : 'bg-rose-950/40 text-rose-300 border-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {notification.text}
        </div>
      )}

      {/* Task list container */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <h2 className="text-base font-semibold text-zinc-100">Active Schedules</h2>

        {loading ? (
          <div className="py-16 text-center text-xs text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-2" />
            Loading active schedules...
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            <div className="h-10 w-10 mx-auto rounded-xl bg-zinc-800/60 flex items-center justify-center text-zinc-400 mb-3">
              <Calendar className="h-5 w-5" />
            </div>
            <p className="font-medium text-zinc-300">No scheduled tasks found.</p>
            <p className="text-zinc-500 mt-1 max-w-sm mx-auto">
              You can tell the agent in chat: "Schedule a task to summarize my emails every morning at 9am" and it will create it automatically!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3 transition-all hover:border-zinc-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-100">{job.prompt}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-mono">
                      <span className="rounded bg-zinc-850 px-2 py-0.5 text-[11px] text-indigo-300 border border-zinc-750">
                        {job.cronExpression}
                      </span>
                      <span className="text-zinc-500">•</span>
                      <span>TZ: {job.timezone}</span>
                      <span className="text-zinc-500">•</span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Clock className="h-3 w-3" />
                        Next: {new Date(job.nextRunAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRunNow(job.id)}
                      disabled={runningJobId === job.id}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                    >
                      {runningJobId === job.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                      Run Now
                    </button>

                    <button
                      onClick={() => handleDelete(job.id)}
                      disabled={deletingJobId === job.id}
                      className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Delete schedule"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {job.lastRunAt && (
                  <div className="rounded-lg bg-zinc-900/90 border border-zinc-800/80 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                      <span className="flex items-center gap-1 font-medium text-zinc-300">
                        <FileText className="h-3 w-3 text-zinc-400" />
                        Last Execution Result
                      </span>
                      <span>{new Date(job.lastRunAt).toLocaleString()}</span>
                    </div>
                    <div className="text-zinc-300 whitespace-pre-wrap font-sans text-xs bg-zinc-950/60 p-2 rounded max-h-32 overflow-y-auto leading-relaxed">
                      {job.lastOutput || 'No output recorded.'}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-4 text-xs text-zinc-400 flex items-start gap-3">
        <Info className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <p>
            Vercel Cron triggers the secure endpoint <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">/api/cron/tick</code> on schedule using your <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">CRON_SECRET</code>.
          </p>
          <p className="mt-1 text-zinc-500">
            The "Run Now" button executes the agent workflow immediately in real-time, sending telegram notifications if linked.
          </p>
        </div>
      </div>
    </div>
  );
}
