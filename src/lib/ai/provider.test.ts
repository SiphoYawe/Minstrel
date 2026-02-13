// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockOpenAIProvider, mockAnthropicProvider, mockCreateOpenAI, mockCreateAnthropic } =
  vi.hoisted(() => {
    const mockOpenAIProvider = vi.fn();
    const mockAnthropicProvider = vi.fn();
    const mockCreateOpenAI = vi.fn(() => mockOpenAIProvider);
    const mockCreateAnthropic = vi.fn(() => mockAnthropicProvider);
    return { mockOpenAIProvider, mockAnthropicProvider, mockCreateOpenAI, mockCreateAnthropic };
  });

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: mockCreateOpenAI,
}));

vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: mockCreateAnthropic,
}));

import { getModelForProvider, DEFAULT_MODELS } from './provider';

describe('provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenAIProvider.mockReturnValue({ id: 'openai-model' });
    mockAnthropicProvider.mockReturnValue({ id: 'anthropic-model' });
  });

  describe('DEFAULT_MODELS', () => {
    it('contains gpt-4o for openai', () => {
      expect(DEFAULT_MODELS.openai).toBe('gpt-4o');
    });

    it('contains claude-sonnet-4-20250514 for anthropic', () => {
      expect(DEFAULT_MODELS.anthropic).toBe('claude-sonnet-4-20250514');
    });
  });

  describe('getModelForProvider — openai', () => {
    it('calls createOpenAI with the correct apiKey', () => {
      getModelForProvider('openai', 'sk-test-key-123');

      expect(mockCreateOpenAI).toHaveBeenCalledWith({ apiKey: 'sk-test-key-123' });
    });

    it('uses the default model gpt-4o when no modelId is provided', () => {
      getModelForProvider('openai', 'sk-test-key-123');

      expect(mockOpenAIProvider).toHaveBeenCalledWith('gpt-4o');
    });

    it('uses a custom modelId when provided', () => {
      getModelForProvider('openai', 'sk-test-key-123', 'gpt-4o-mini');

      expect(mockOpenAIProvider).toHaveBeenCalledWith('gpt-4o-mini');
    });

    it('does not call createAnthropic', () => {
      getModelForProvider('openai', 'sk-test-key-123');

      expect(mockCreateAnthropic).not.toHaveBeenCalled();
    });
  });

  describe('getModelForProvider — anthropic', () => {
    it('calls createAnthropic with the correct apiKey', () => {
      getModelForProvider('anthropic', 'sk-ant-test-key-456');

      expect(mockCreateAnthropic).toHaveBeenCalledWith({ apiKey: 'sk-ant-test-key-456' });
    });

    it('uses the default model claude-sonnet-4-20250514 when no modelId is provided', () => {
      getModelForProvider('anthropic', 'sk-ant-test-key-456');

      expect(mockAnthropicProvider).toHaveBeenCalledWith('claude-sonnet-4-20250514');
    });

    it('uses a custom modelId when provided', () => {
      getModelForProvider('anthropic', 'sk-ant-test-key-456', 'claude-haiku-3');

      expect(mockAnthropicProvider).toHaveBeenCalledWith('claude-haiku-3');
    });

    it('does not call createOpenAI', () => {
      getModelForProvider('anthropic', 'sk-ant-test-key-456');

      expect(mockCreateOpenAI).not.toHaveBeenCalled();
    });
  });

  describe('getModelForProvider — return value', () => {
    it('returns the model object from the openai provider', () => {
      const result = getModelForProvider('openai', 'sk-key');

      expect(result).toEqual({ id: 'openai-model' });
    });

    it('returns the model object from the anthropic provider', () => {
      const result = getModelForProvider('anthropic', 'sk-key');

      expect(result).toEqual({ id: 'anthropic-model' });
    });
  });
});
