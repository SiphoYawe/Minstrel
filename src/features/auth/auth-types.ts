import { z } from 'zod/v4';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const MIN_AGE = 13;
export const MIN_PASSWORD_LENGTH = 8;

// API Key types (Story 3.3)
export type ApiKeyProvider = 'openai' | 'anthropic' | 'other';

export interface ApiKeyMetadata {
  provider: ApiKeyProvider;
  lastFour: string;
  status: 'active' | 'invalid' | 'validating';
  createdAt: string;
  updatedAt: string;
}

export const apiKeySubmitSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'other']),
  apiKey: z.string().min(10, 'API key seems too short').max(500, 'API key seems too long'),
});

export type ApiKeySubmitData = z.infer<typeof apiKeySubmitSchema>;
