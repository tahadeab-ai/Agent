import { Composio } from '@composio/core';
import { VercelProvider } from '@composio/vercel';
import { supermemoryTools } from '@supermemory/tools/ai-sdk';
import { getLocalTools } from './local-tools';

export const composio = process.env.COMPOSIO_API_KEY
  ? new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
      provider: new VercelProvider(),
    })
  : null;

export async function getComposioToolsForUser(
  userId: string,
  userType: string = 'regular'
): Promise<Record<string, any>> {
  if (userType === 'guest') {
    console.log(`[Composio] User is a guest (${userId}). Returning empty tools.`);
    return {};
  }

  if (!process.env.COMPOSIO_API_KEY || !composio) {
    console.log('[Composio] Missing COMPOSIO_API_KEY. Returning empty tools.');
    return {};
  }

  try {
    const session = await composio.create(userId, { manageConnections: true });
    const tools = await session.tools();
    return tools || {};
  } catch (error) {
    console.error('[Composio] Failed to load tools for user:', error);
    return {};
  }
}

export async function getMemoryTools(
  userId: string,
  userType: string = 'regular'
): Promise<Record<string, any>> {
  if (userType !== 'regular') {
    console.log(`[Supermemory] User type is '${userType}'. Supermemory is only enabled for regular users.`);
    return {};
  }

  if (!process.env.SUPERMEMORY_API_KEY) {
    console.log('[Supermemory] Missing SUPERMEMORY_API_KEY. Returning empty tools.');
    return {};
  }

  try {
    const tools = supermemoryTools(process.env.SUPERMEMORY_API_KEY, {
      containerTags: [userId], // Scopes memory per user
    });
    return tools || {};
  } catch (error) {
    console.error('[Supermemory] Failed to initialize Supermemory:', error);
    return {};
  }
}

export async function getAllToolsForUser(
  userId: string,
  userType: string = 'regular'
): Promise<Record<string, any>> {
  const localTools = getLocalTools(userId);

  const [composioTools, memoryTools] = await Promise.all([
    getComposioToolsForUser(userId, userType),
    getMemoryTools(userId, userType),
  ]);

  return {
    ...localTools,
    ...composioTools,
    ...memoryTools,
  };
}
