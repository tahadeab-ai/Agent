'use client';

import { useEffect, useState } from 'react';
import {
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
} from 'lucide-react';

export default function AgentSoulPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [soul, setSoul] = useState('');
  const [defaultSoul, setDefaultSoul] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSoul = () => {
    setLoading(true);
    fetch('/api/agent/soul')
      .then((res) => res.json())
      .then((data) => {
        setSoul(data.soul || data.defaultSoul || '');
        setDefaultSoul(data.defaultSoul || '');
        setIsCustom(data.isCustom);
      })
      .catch((err) => {
        setMessage({ type: 'error', text: 'Failed to load agent soul: ' + err.message });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSoul();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/agent/soul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soul }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCustom(true);
        setMessage({ type: 'success', text: 'Agent soul successfully saved! New personality applied.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save soul.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset your Agent Soul to the default template? This will also re-enable conversational onboarding on your next chat.')) {
      return;
    }

    setResetting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/agent/soul', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSoul(defaultSoul);
        setIsCustom(false);
        setMessage({ type: 'success', text: 'Soul reset to default template. Onboarding re-enabled!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to reset soul.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-indigo-400" />
            Agent Soul & Personality
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Customize your AI agent's identity, core instructions, tone of voice, and behavioral principles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider border ${
              isCustom
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
            }`}
          >
            {isCustom ? 'Custom Soul Active' : 'Default Template'}
          </span>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl p-4 text-xs font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
              : 'bg-rose-950/40 text-rose-300 border-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-zinc-400" />
            Soul Definition (Markdown)
          </label>
          <span className="text-xs text-zinc-500 font-mono">
            {soul.length} / 4000 characters
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500 mb-2" />
            Loading personality configuration...
          </div>
        ) : (
          <textarea
            value={soul}
            onChange={(e) => setSoul(e.target.value)}
            rows={16}
            maxLength={4000}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
            placeholder="# Agent Soul&#10;&#10;You are a personalized assistant..."
          />
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            onClick={handleReset}
            disabled={resetting || saving || loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {resetting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
            )}
            Reset to Default
          </button>

          <button
            onClick={handleSave}
            disabled={saving || resetting || loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-medium text-white shadow-md hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
