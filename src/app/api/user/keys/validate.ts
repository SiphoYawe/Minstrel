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

/**
 * Validate an OpenAI key using the free GET /v1/models endpoint.
 * No tokens are consumed.
 */
async function validateOpenAI(apiKey: string): Promise<ValidationResult> {
  try {
    const response = await fetchWithTimeout('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
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

/** Anthropic key format regex */
const ANTHROPIC_KEY_REGEX = /^sk-ant-[a-zA-Z0-9\-_]{40,}$/;

/**
 * Validate an Anthropic key using format check + a non-generating endpoint.
 * Falls back to format-only validation if the endpoint is unavailable.
 */
async function validateAnthropic(apiKey: string): Promise<ValidationResult> {
  // First: format validation (zero network cost)
  if (!ANTHROPIC_KEY_REGEX.test(apiKey)) {
    return {
      valid: false,
      error: {
        code: 'INVALID_KEY',
        message:
          "This doesn't look like a valid Anthropic API key — it should start with 'sk-ant-'",
      },
    };
  }

  // Second: lightweight endpoint check using count_tokens (no generation)
  try {
    const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages/count_tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    if (response.ok) {
      return { valid: true };
    }
    // 401/403 means key is invalid, 404 means endpoint not available
    if (response.status === 404) {
      // Endpoint not available — format check alone is sufficient
      return { valid: true };
    }
    return parseProviderError(response.status);
  } catch {
    // Network error — format check passed, accept the key
    return { valid: true };
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
