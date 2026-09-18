import { streamText, convertToCoreMessages } from 'ai';
import { getCurrentSession } from '@/lib/auth';
import { getUserSoul } from '@/lib/db/queries';
import { assembleSystemPrompt } from '@/lib/ai/prompts';
import { getLanguageModel } from '@/lib/ai/models';
import { getLocalTools } from '@/lib/ai/local-tools';
import { getComposioToolsForUser, getMemoryTools } from '@/lib/ai/tools';
import { sanitizeMessages } from '@/lib/ai/sanitize';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    const userId = session.user.id;
    const userType = session.user.type;

    const { messages } = await req.json();
    const sanitizedRawMessages = sanitizeMessages(messages);

    // Fetch user's soul from database
    const soul = await getUserSoul(userId);

    // Fetch tools dynamically
    const localTools = getLocalTools(userId);
    const [composioTools, memoryTools] = await Promise.all([
      getComposioToolsForUser(userId, userType),
      getMemoryTools(userId, userType),
    ]);

    const tools = {
      ...localTools,
      ...composioTools,
      ...memoryTools,
    };

    // Assemble dynamic system prompt
    const system = assembleSystemPrompt({
      soul,
      userType,
      hasComposio: Boolean(process.env.COMPOSIO_API_KEY && userType !== 'guest'),
      hasSupermemory: Boolean(process.env.SUPERMEMORY_API_KEY && userType !== 'guest'),
    });

    const model = getLanguageModel();
    const coreMessages = convertToCoreMessages(sanitizedRawMessages);

    const result = streamText({
      model,
      system,
      messages: coreMessages,
      tools,
      maxSteps: 10,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('[API/Chat] Error processing chat request:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'An error occurred while processing the chat request.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
