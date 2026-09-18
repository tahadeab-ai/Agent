'use client';

import { useEffect, useState } from 'react';
import {
  Plug,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';

interface ConnectedAccount {
  id: string;
  appName: string;
  status: string;
  createdAt?: string;
}

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    isGuest?: boolean;
    hasApiKey?: boolean;
    accounts?: ConnectedAccount[];
    message?: string;
    error?: string;
  } | null>(null);

  const fetchAccounts = () => {
    setLoading(true);
    fetch('/api/composio/accounts')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
      })
      .catch((err) => {
        setData({ error: err.message });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Plug className="h-6 w-6 text-indigo-400" />
            External Tool Integrations (Composio)
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your connected apps and services (Gmail, GitHub, Slack, Notion, etc.) scoped to your account.
          </p>
        </div>

        <button
          onClick={fetchAccounts}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {/* Guest User State */}
      {data?.isGuest && (
        <div className="rounded-2xl border border-amber-800/60 bg-amber-950/30 p-5 text-amber-200">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-300">Guest Mode Active</h3>
              <p className="text-xs text-amber-200/80 mt-1">
                You are currently signed in as a guest. Composio external tool connections and private credentials are disabled in guest mode.
              </p>
              <p className="text-xs text-amber-300/90 font-medium mt-2">
                Tip: Click "Regular" in the top bar to switch to a full user session.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Missing API Key State */}
      {!data?.isGuest && !data?.hasApiKey && (
        <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 p-5 text-rose-200">
          <div className="flex items-start gap-3">
            <KeyRound className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-rose-300">Missing COMPOSIO_API_KEY</h3>
              <p className="text-xs text-rose-200/80 mt-1">
                The application is running with graceful degradation. Chat continues to function, but external tool integrations are disabled until a valid <code className="bg-rose-900/60 px-1 py-0.5 rounded text-rose-100">COMPOSIO_API_KEY</code> is provided in your environment variables.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* API Error State */}
      {data?.error && (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-xs text-rose-300">
          <strong>Notice:</strong> {data.error}
        </div>
      )}

      {/* Connected Accounts List */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-base font-semibold text-zinc-100 mb-4">
          Connected Accounts for Current User
        </h2>

        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            Checking connected services...
          </div>
        ) : !data?.accounts || data.accounts.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            <div className="h-10 w-10 mx-auto rounded-xl bg-zinc-800/60 flex items-center justify-center text-zinc-400 mb-3">
              <Plug className="h-5 w-5" />
            </div>
            <p className="font-medium text-zinc-300">No external accounts connected yet.</p>
            <p className="text-zinc-500 mt-1 max-w-md mx-auto">
              When you ask the agent in chat to interact with Gmail, GitHub, or Notion, it will provide you with an OAuth connection link to link your account.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {data.accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs uppercase">
                    {acc.appName.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-zinc-200">{acc.appName}</h4>
                    <span className="text-[11px] text-zinc-500 font-mono">ID: {acc.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 border border-emerald-800 px-2.5 py-0.5 text-xs text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    {acc.status || 'ACTIVE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-4 text-xs text-zinc-400 flex items-start gap-3">
        <Info className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
        <p>
          Composio uses the Tool Router session API with your user ID to isolate connections per user. Tools are dynamically discovered by the AI model during conversation turns.
        </p>
      </div>
    </div>
  );
}
