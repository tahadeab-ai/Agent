import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';

export function getLanguageModel(): LanguageModel {
  const openaiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (anthropicKey) {
    const anthropic = createAnthropic({
      apiKey: anthropicKey,
    });
    return anthropic('claude-3-5-sonnet-20241022') as unknown as LanguageModel;
  }

  // Default to OpenAI / AI Gateway
  const openai = createOpenAI({
    apiKey: openaiKey || 'placeholder-key',
    baseURL: process.env.AI_GATEWAY_API_KEY ? 'https://gateway.ai.cloudflare.com/v1' : undefined,
  });

  return openai('gpt-4o') as unknown as LanguageModel;
}
