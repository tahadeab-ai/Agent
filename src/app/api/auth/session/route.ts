import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession, DEFAULT_GUEST_USER, DEFAULT_REGULAR_USER } from '@/lib/auth';

export async function GET() {
  const session = await getCurrentSession();
  return NextResponse.json(session);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type === 'guest' ? 'guest' : 'regular';
    const user = type === 'guest' ? DEFAULT_GUEST_USER : DEFAULT_REGULAR_USER;

    const response = NextResponse.json({ success: true, user });
    response.cookies.set('agent_session', JSON.stringify(user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to switch user mode' }, { status: 400 });
  }
}
