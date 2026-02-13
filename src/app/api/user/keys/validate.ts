export interface ValidationResult {
  valid: boolean;
  error?: {
    code: 'INVALID_KEY' | 'PROVIDER_DOWN' | 'RATE_LIMITED';
    message: string;
  };
}

const TIMEOUT_MS = 5000;

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseProviderError(status: number): ValidationResult {
  if (status === 401 || status === 403) {
    return {
      valid: false,
      error: {
        code: 'INVALID_KEY',
        message: "This API key doesn't appear to be valid — check it and try again",
      },
    };
  }
  if (status === 429) {
    return {
      valid: false,
      error: {
        code: 'RATE_LIMITED',
        message: "The provider says you're sending too many requests — wait a moment",
      },
    };
  }
  return {
    valid: false,
    error: {
      code: 'PROVIDER_DOWN',
      message: "We couldn't reach the provider right now — try again in a moment",
    },
  };
}

async function validateOpenAI(apiKey: string): Promise<ValidationResult> {
  try {
    const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      }),
    });

    if (response.ok) {
      return { valid: true };
    }
    return parseProviderError(response.status);
  } catch {
    return {
      valid: false,
      error: {
        code: 'PROVIDER_DOWN',
        message: "We couldn't reach the provider right now — try again in a moment",
      },
    };
  }
}

async function validateAnthropic(apiKey: string): Promise<ValidationResult> {
  try {
    const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      }),
    });

    if (response.ok) {
      return { valid: true };
    }
    return parseProviderError(response.status);
  } catch {
    return {
      valid: false,
      error: {
        code: 'PROVIDER_DOWN',
        message: "We couldn't reach the provider right now — try again in a moment",
      },
    };
  }
}

export async function validateApiKey(provider: string, apiKey: string): Promise<ValidationResult> {
  switch (provider) {
    case 'openai':
      return validateOpenAI(apiKey);
    case 'anthropic':
      return validateAnthropic(apiKey);
    default:
      return { valid: true };
  }
}
