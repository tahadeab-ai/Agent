export async function sendTelegramMessage(chatId: string | number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('[Telegram] TELEGRAM_BOT_TOKEN is not configured.');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });

    if (!res.ok) {
      const errData = await res.text();
      console.error(`[Telegram] Send error (${res.status}):`, errData);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Telegram] Network error sending message:', error);
    return false;
  }
}

export function getTelegramDeepLink(token: string): string {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'MyAIAgentBot';
  return `https://t.me/${botUsername}?start=${token}`;
}
