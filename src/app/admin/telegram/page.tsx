'use client';

import { useEffect, useState } from 'react';
import {
  Send,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Loader2,
  Info,
  ShieldCheck,
} from 'lucide-react';

export default function TelegramAdminPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    chatId: string | null;
    username: string | null;
  } | null>(null);

  const [linkData, setLinkData] = useState<{
    url: string;
    token: string;
    expiresAt: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const checkStatus = () => {
    setLoading(true);
    fetch('/api/telegram/link')
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
      })
      .catch((err) => {
        console.error('Failed to load telegram status:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const generateLink = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/telegram/link', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setLinkData(data);
      }
    } catch (err) {
      console.error('Failed to generate token:', err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!linkData?.url) return;
    navigator.clipboard.writeText(linkData.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Send className="h-6 w-6 text-sky-400" />
            Telegram Integration
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Connect your Telegram account to chat with the same AI agent with unified memory and tools on mobile.
          </p>
        </div>

        <button
          onClick={checkStatus}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Connection Status Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-100">Telegram Link Status</h2>
          {status && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                status.connected
                  ? 'border-emerald-800 bg-emerald-950/60 text-emerald-300'
                  : 'border-zinc-700 bg-zinc-800/80 text-zinc-400'
              }`}
            >
              {status.connected ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" /> Not Connected
                </>
              )}
            </span>
          )}
        </div>

        {status?.connected ? (
          <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4 text-xs text-emerald-200">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Your account is successfully linked to Telegram Chat ID: <span className="font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">{status.chatId}</span>
            </div>
            <p className="mt-1 text-emerald-300/80">
              Any messages you send to @{status.username || 'the bot'} on Telegram will be processed using your personalized Agent Soul, Supermemory, and Composio tools.
            </p>
          </div>
        ) : (
          <div className="text-xs text-zinc-400">
            No Telegram chat is currently linked to your user profile. Click the button below to generate a secure 1-click connection link.
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={generateLink}
            disabled={generating}
            className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-medium text-white shadow-md hover:bg-sky-500 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {status?.connected ? 'Generate New Link Token' : 'Generate Connection Link'}
          </button>
        </div>

        {linkData && (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium text-zinc-300">Your Deep Link (Expires in 10 minutes)</span>
              <span className="font-mono text-[11px] text-zinc-500">
                Expires: {new Date(linkData.expiresAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                readOnly
                value={linkData.url}
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-200 focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-750"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <a
                href={linkData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Telegram
              </a>
            </div>

            <p className="text-[11px] text-zinc-500">
              Clicking this link will open your Telegram app and send <code>/start {linkData.token}</code> to automatically pair your account.
            </p>
          </div>
        )}
      </div>

      {/* Instructions & Webhook Setup */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-3 text-xs text-zinc-400">
        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <Info className="h-4 w-4 text-indigo-400" />
          Production Telegram Webhook Setup Instructions
        </h3>
        <p>
          To receive incoming messages from Telegram in production, set your webhook URL via the Telegram Bot API:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300 border border-zinc-800">
curl -X POST "https://api.telegram.org/bot&lt;YOUR_BOT_TOKEN&gt;/setWebhook" \
  -H "Content-Type: application/json" \
  -d '&#123;
    "url": "https://&lt;your-domain&gt;.vercel.app/api/telegram-webhook",
    "secret_token": "&lt;YOUR_TELEGRAM_WEBHOOK_SECRET&gt;"
  &#125;'
        </pre>
        <p>
          Incoming updates are authenticated using the <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">X-Telegram-Bot-Api-Secret-Token</code> header against <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">TELEGRAM_WEBHOOK_SECRET</code>.
        </p>
      </div>
    </div>
  );
}
