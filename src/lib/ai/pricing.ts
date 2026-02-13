export interface ModelPricing {
  inputPer1kTokens: number;
  outputPer1kTokens: number;
}

export interface ProviderPricing {
  [provider: string]: {
    [model: string]: ModelPricing;
  };
}

export const PRICING_LAST_UPDATED = '2026-02-12';

export const PROVIDER_PRICING: ProviderPricing = {
  openai: {
    'gpt-4o': { inputPer1kTokens: 0.0025, outputPer1kTokens: 0.01 },
    'gpt-4o-mini': { inputPer1kTokens: 0.00015, outputPer1kTokens: 0.0006 },
    'gpt-4-turbo': { inputPer1kTokens: 0.01, outputPer1kTokens: 0.03 },
    'gpt-3.5-turbo': { inputPer1kTokens: 0.0005, outputPer1kTokens: 0.0015 },
  },
  anthropic: {
    'claude-sonnet-4-20250514': { inputPer1kTokens: 0.003, outputPer1kTokens: 0.015 },
    'claude-3-5-haiku-20241022': { inputPer1kTokens: 0.00025, outputPer1kTokens: 0.00125 },
    'claude-3-opus-20240229': { inputPer1kTokens: 0.015, outputPer1kTokens: 0.075 },
  },
};

const DEFAULT_PRICING: ModelPricing = {
  inputPer1kTokens: 0.003,
  outputPer1kTokens: 0.015,
};

function getModelPricing(provider: string, model: string): ModelPricing {
  const providerPricing = PROVIDER_PRICING[provider.toLowerCase()];
  if (!providerPricing) return DEFAULT_PRICING;

  const modelPricing = providerPricing[model];
  if (modelPricing) return modelPricing;

  // Try prefix matching (e.g., "gpt-4o-2024-08-06" matches "gpt-4o").
  // Sort by descending key length so "gpt-4o-mini" matches before "gpt-4o".
  const sortedKeys = Object.keys(providerPricing).sort((a, b) => b.length - a.length);
  for (const knownModel of sortedKeys) {
    if (model.startsWith(knownModel)) {
      return providerPricing[knownModel];
    }
  }

  return DEFAULT_PRICING;
}

export function estimateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = getModelPricing(provider, model);
  const inputCost = (Math.max(0, inputTokens) / 1000) * pricing.inputPer1kTokens;
  const outputCost = (Math.max(0, outputTokens) / 1000) * pricing.outputPer1kTokens;
  return inputCost + outputCost;
}
