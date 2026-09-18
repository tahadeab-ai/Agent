'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Bot,
  Plug,
  Sparkles,
  Send,
  Calendar,
  User as UserIcon,
  Loader2,
} from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; name: string; type: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const switchUserType = async (newType: 'regular' | 'guest') => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newType }),
      });
      const data = await res.json();
      if (data?.user) {
        setUser(data.user);
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { label: 'Chat', href: '/', icon: Bot },
    { label: 'Integrations', href: '/admin', icon: Plug },
    { label: 'Agent Soul', href: '/admin/agent', icon: Sparkles },
    { label: 'Telegram', href: '/admin/telegram', icon: Send },
    { label: 'Schedules', href: '/admin/schedules', icon: Calendar },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-zinc-100 hover:text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md">
              <Bot className="h-5 w-5" />
            </div>
            <span className="text-lg tracking-tight">Antigravity Agent</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User mode switcher & status badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-xs">
            <UserIcon className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-zinc-300 font-medium">{user?.name || 'Loading...'}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                user?.type === 'guest'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
              }`}
            >
              {user?.type || '...'}
            </span>
          </div>

          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5 text-xs">
            <button
              onClick={() => switchUserType('regular')}
              disabled={loading || user?.type === 'regular'}
              className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                user?.type === 'regular'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {loading && user?.type !== 'regular' ? (
                <Loader2 className="h-3 w-3 animate-spin inline" />
              ) : (
                'Regular'
              )}
            </button>
            <button
              onClick={() => switchUserType('guest')}
              disabled={loading || user?.type === 'guest'}
              className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                user?.type === 'guest'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {loading && user?.type !== 'guest' ? (
                <Loader2 className="h-3 w-3 animate-spin inline" />
              ) : (
                'Guest'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden border-t border-zinc-800 px-4 py-2 justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
                isActive ? 'text-indigo-400' : 'text-zinc-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
