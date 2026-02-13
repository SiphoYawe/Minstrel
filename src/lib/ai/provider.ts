import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export type SupportedProvider = 'openai' | 'anthropic';

const DEFAULT_MODELS: Record<SupportedProvider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
};

/**
 * Create an AI SDK provider instance for the given provider and API key.
 * Provider is selected at request time, not at app startup.
 */
function createProvider(providerId: SupportedProvider, apiKey: string) {
  switch (providerId) {
    case 'openai':
      return createOpenAI({ apiKey });
    case 'anthropic':
      return createAnthropic({ apiKey });
  }
}

/**
 * Get a configured language model for the given provider and API key.
 * Returns the default model for the provider unless overridden.
 */
export function getModelForProvider(
  providerId: SupportedProvider,
  apiKey: string,
  modelId?: string
) {
  const provider = createProvider(providerId, apiKey);
  const model = modelId ?? DEFAULT_MODELS[providerId];
  return provider(model);
}

export { DEFAULT_MODELS };
