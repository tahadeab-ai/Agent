import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import {
  getUserByTelegramLinkToken,
  getUserByTelegramChatId,
  linkTelegramChat,
  saveTelegramTurn,
  getTelegramTurns,
  getUserSoul,
} from '@/lib/db/queries';
import { sendTelegramMessage } from '@/lib/telegram';
import { getLanguageModel } from '@/lib/ai/models';
import { getAllToolsForUser } from '@/lib/ai/tools';
import { assembleSystemPrompt } from '@/lib/ai/prompts';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // 1. Validate secret token if configured
    const secretTokenHeader = req.headers.get('x-telegram-bot-api-secret-token');
    const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (configuredSecret && secretTokenHeader !== configuredSecret) {
      console.warn('[Telegram Webhook] Unauthorized request: secret token mismatch');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await req.json();
    const message = payload.message || payload.edited_message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text = message.text.trim();

    // 2. Handle /start <token> deep link
    if (text.startsWith('/start')) {
      const parts = text.split(/\s+/);
      const token = parts[1];

      if (token) {
        const user = await getUserByTelegramLinkToken(token);
        if (!user) {
          await sendTelegramMessage(chatId, '❌ Invalid or already used link token. Please generate a new link in your dashboard.');
          return NextResponse.json({ ok: true });
        }

        if (user.telegramLinkTokenExpiresAt && new Date() > new Date(user.telegramLinkTokenExpiresAt)) {
          await sendTelegramMessage(chatId, '⚠️ This link token has expired. Please generate a fresh link in your dashboard.');
          return NextResponse.json({ ok: true });
        }

        await linkTelegramChat(user.id, chatId);
        await sendTelegramMessage(
          chatId,
          `🎉 Account successfully linked! Welcome, ${user.name || 'friend'}. You now share the same agent personality, memory, and tools here on Telegram.`
        );
        return NextResponse.json({ ok: true });
      } else {
        await sendTelegramMessage(
          chatId,
          '👋 Hello! To connect this bot with your AI Agent, please open your web dashboard and click "Connect Telegram".'
        );
        return NextResponse.json({ ok: true });
      }
    }

    // 3. Regular chat message
    const user = await getUserByTelegramChatId(chatId);
    if (!user) {
      await sendTelegramMessage(
        chatId,
        '⚠️ Your Telegram account is not linked to an AI Agent profile. Please visit your web dashboard to link your account.'
      );
      return NextResponse.json({ ok: true });
    }

    // Save user message to Telegram turns
    await saveTelegramTurn({
      userId: user.id,
      chatId,
      role: 'user',
      content: text,
    });

    // Fetch conversation history for working memory
    const history = await getTelegramTurns(chatId, 10);
    const messages = history.map((turn) => ({
      role: turn.role as 'user' | 'assistant' | 'system',
      content: turn.content,
    }));

    // Load soul and tools
    const soul = await getUserSoul(user.id);
    const tools = await getAllToolsForUser(user.id, user.type);

    const system = assembleSystemPrompt({
      soul,
      userType: user.type as 'regular' | 'guest',
      hasComposio: Boolean(process.env.COMPOSIO_API_KEY && user.type !== 'guest'),
      hasSupermemory: Boolean(process.env.SUPERMEMORY_API_KEY && user.type !== 'guest'),
    });

    const model = getLanguageModel();

    const response = await generateText({
      model,
      system,
      messages,
      tools,
      maxSteps: 5,
    });

    const replyContent = response.text || 'Done.';

    // Save assistant reply turn
    await saveTelegramTurn({
      userId: user.id,
      chatId,
      role: 'assistant',
      content: replyContent,
    });

    // Send to Telegram
    await sendTelegramMessage(chatId, replyContent);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Telegram Webhook] Error processing update:', error);
    return NextResponse.json({ ok: true, error: error?.message });
  }
}
