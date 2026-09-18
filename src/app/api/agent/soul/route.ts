import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { getUserSoul, updateUserSoul } from '@/lib/db/queries';
import { DEFAULT_SOUL } from '@/lib/ai/prompts';

export async function GET() {
  try {
    const session = await getCurrentSession();
    const soul = await getUserSoul(session.user.id);

    return NextResponse.json({
      soul: soul || null,
      defaultSoul: DEFAULT_SOUL,
      isCustom: Boolean(soul),
      user: session.user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch agent soul' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    const body = await req.json();
    const { soul } = body;

    if (typeof soul !== 'string') {
      return NextResponse.json({ error: 'Soul must be a string' }, { status: 400 });
    }

    const success = await updateUserSoul(session.user.id, soul);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update agent soul' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getCurrentSession();
    const success = await updateUserSoul(session.user.id, null);
    return NextResponse.json({ success, message: 'Soul reset to default template' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to reset agent soul' },
      { status: 500 }
    );
  }
}
