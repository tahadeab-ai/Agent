import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { composio } from '@/lib/ai/tools';

export async function GET() {
  try {
    const session = await getCurrentSession();
    const userId = session.user.id;
    const userType = session.user.type;

    if (userType === 'guest') {
      return NextResponse.json({
        isGuest: true,
        hasApiKey: Boolean(process.env.COMPOSIO_API_KEY),
        accounts: [],
        message: 'Guest users cannot connect external accounts. Please switch to a regular user.',
      });
    }

    if (!process.env.COMPOSIO_API_KEY || !composio) {
      return NextResponse.json({
        isGuest: false,
        hasApiKey: false,
        accounts: [],
        message: 'COMPOSIO_API_KEY is not configured in environment variables.',
      });
    }

    try {
      const response = await composio.connectedAccounts.list({
        userIds: [userId],
      });

      const accounts = Array.isArray(response)
        ? response
        : (response as any)?.items || [];

      return NextResponse.json({
        isGuest: false,
        hasApiKey: true,
        accounts,
      });
    } catch (apiError: any) {
      console.error('[API/Composio/Accounts] Composio API call failed:', apiError);
      return NextResponse.json({
        isGuest: false,
        hasApiKey: true,
        accounts: [],
        error: apiError?.message || 'Failed to communicate with Composio API',
      });
    }
  } catch (error: any) {
    console.error('[API/Composio/Accounts] Unexpected error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch connected accounts' },
      { status: 500 }
    );
  }
}
