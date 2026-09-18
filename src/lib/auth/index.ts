import { cookies } from 'next/headers';
import { upsertUser } from '../db/queries';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  type: 'regular' | 'guest';
}

export interface Session {
  user: SessionUser;
}

export const DEFAULT_REGULAR_USER: SessionUser = {
  id: 'user_regular_default',
  name: 'Default User',
  email: 'user@example.com',
  type: 'regular',
};

export const DEFAULT_GUEST_USER: SessionUser = {
  id: 'user_guest_default',
  name: 'Guest User',
  email: 'guest@example.com',
  type: 'guest',
};

export async function getCurrentSession(): Promise<Session> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('agent_session')?.value;

  let user: SessionUser = DEFAULT_REGULAR_USER;

  if (sessionCookie) {
    try {
      const parsed = JSON.parse(sessionCookie);
      if (parsed && parsed.id && (parsed.type === 'regular' || parsed.type === 'guest')) {
        user = {
          id: parsed.id,
          name: parsed.name || (parsed.type === 'guest' ? 'Guest User' : 'Default User'),
          email: parsed.email || `${parsed.id}@example.com`,
          type: parsed.type,
        };
      }
    } catch {
      // Fallback to default user if parsing fails
    }
  }

  // Ensure user exists in database in background (graceful if DB not connected)
  upsertUser({
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
  }).catch(() => {});

  return { user };
}
