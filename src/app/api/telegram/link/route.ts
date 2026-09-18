import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { createTelegramLinkToken, getUserById } from '@/lib/db/queries';
import { getTelegramDeepLink } from '@/lib/telegram';

export async function GET() {
  try {
    const session = await getCurrentSession();
    const user = await getUserById(session.user.id);

    return NextResponse.json({
      connected: Boolean(user?.telegramChatId),
      chatId: user?.telegramChatId || null,
      username: process.env.TELEGRAM_BOT_USERNAME || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to check telegram status' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getCurrentSession();
    const userId = session.user.id;

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const success = await createTelegramLinkToken(userId, token, expiresAt);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to create telegram link token' },
        { status: 500 }
      );
    }

    const deepLink = getTelegramDeepLink(token);

    return NextResponse.json({
      success: true,
      token,
      expiresAt: expiresAt.toISOString(),
      url: deepLink,
    });
  } catch (error: any) {
    console.error('[API/Telegram/Link] Error generating link:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate link' },
      { status: 500 }
    );
  }
}
