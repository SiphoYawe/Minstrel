// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encrypt, decrypt } from './crypto';

const TEST_KEY = 'a]3kF9$mNqR7vLxP2wYb8cDhJ5sGtU0eA';

describe('crypto', () => {
  describe('encrypt', () => {
    it('returns a string with three base64 parts separated by colons', () => {
      const result = encrypt('test-api-key-12345', TEST_KEY);
      const parts = result.split(':');
      expect(parts).toHaveLength(3);
      parts.forEach((part) => {
        expect(() => Buffer.from(part, 'base64')).not.toThrow();
      });
    });

    it('throws for empty plaintext', () => {
      expect(() => encrypt('', TEST_KEY)).toThrow('Cannot encrypt empty string');
    });

    it('throws for short encryption key', () => {
      expect(() => encrypt('test', 'short')).toThrow(
        'Encryption key must be at least 32 characters'
      );
    });

    it('produces different ciphertexts for the same plaintext (unique IV)', () => {
      const result1 = encrypt('same-plaintext', TEST_KEY);
      const result2 = encrypt('same-plaintext', TEST_KEY);
      expect(result1).not.toBe(result2);
    });

    it('produces different ciphertexts for different keys', () => {
      const key2 = 'b]4lG0$nOrS8wMyQ3xZc9dEiK6tHuV1fB';
      const result1 = encrypt('test-api-key', TEST_KEY);
      const result2 = encrypt('test-api-key', key2);
      expect(result1).not.toBe(result2);
    });
  });

  describe('decrypt', () => {
    it('round-trips: decrypt(encrypt(plaintext)) returns original', () => {
      const plaintext = 'sk-proj-abc123def456';
      const encrypted = encrypt(plaintext, TEST_KEY);
      const decrypted = decrypt(encrypted, TEST_KEY);
      expect(decrypted).toBe(plaintext);
    });

    it('round-trips unicode content', () => {
      const plaintext = 'key-with-unicode-\u00e9\u00e8\u00ea';
      const encrypted = encrypt(plaintext, TEST_KEY);
      const decrypted = decrypt(encrypted, TEST_KEY);
      expect(decrypted).toBe(plaintext);
    });

    it('round-trips long keys', () => {
      const plaintext = 'sk-ant-api03-' + 'a'.repeat(200);
      const encrypted = encrypt(plaintext, TEST_KEY);
      const decrypted = decrypt(encrypted, TEST_KEY);
      expect(decrypted).toBe(plaintext);
    });

    it('throws for empty encrypted string', () => {
      expect(() => decrypt('', TEST_KEY)).toThrow('Cannot decrypt empty string');
    });

    it('throws for invalid format (missing parts)', () => {
      expect(() => decrypt('onlyonepart', TEST_KEY)).toThrow('Invalid encrypted payload format');
    });

    it('throws when decrypting with wrong key', () => {
      const encrypted = encrypt('test-plaintext', TEST_KEY);
      const wrongKey = 'c]5mH1$oPsT9xNzR4yAd0eFjL7uIvW2gC';
      expect(() => decrypt(encrypted, wrongKey)).toThrow();
    });

    it('throws for tampered ciphertext', () => {
      const encrypted = encrypt('test-plaintext', TEST_KEY);
      const parts = encrypted.split(':');
      parts[2] = Buffer.from('tampered-data').toString('base64');
      const tampered = parts.join(':');
      expect(() => decrypt(tampered, TEST_KEY)).toThrow();
    });

    it('throws for tampered auth tag', () => {
      const encrypted = encrypt('test-plaintext', TEST_KEY);
      const parts = encrypted.split(':');
      parts[1] = Buffer.from('0000000000000000').toString('base64');
      const tampered = parts.join(':');
      expect(() => decrypt(tampered, TEST_KEY)).toThrow();
    });
  });

  describe('getDecryptedApiKey', () => {
    const mockEncryptedKey = encrypt('sk-real-api-key-12345', TEST_KEY);

    function setupMocks(options: {
      user: { id: string } | null;
      queryResult: { data: { encrypted_key: string } | null; error: unknown };
      envKey?: string;
    }) {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(options.queryResult),
      };
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: options.user },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      };

      vi.doMock('@/lib/supabase/server', () => ({
        createClient: vi.fn().mockResolvedValue(mockSupabase),
      }));

      process.env.ENCRYPTION_KEY = options.envKey ?? TEST_KEY;
    }

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('returns decrypted key for authenticated user', async () => {
      setupMocks({
        user: { id: 'user-123' },
        queryResult: { data: { encrypted_key: mockEncryptedKey }, error: null },
      });

      const { getDecryptedApiKey } = await import('./crypto');
      const result = await getDecryptedApiKey('openai');
      expect(result).toBe('sk-real-api-key-12345');
    });

    it('returns null when user is not authenticated', async () => {
      setupMocks({
        user: null,
        queryResult: { data: null, error: null },
      });

      const { getDecryptedApiKey } = await import('./crypto');
      const result = await getDecryptedApiKey('openai');
      expect(result).toBeNull();
    });

    it('returns null when no key found for provider', async () => {
      setupMocks({
        user: { id: 'user-123' },
        queryResult: { data: null, error: { code: 'PGRST116', message: 'not found' } },
      });

      const { getDecryptedApiKey } = await import('./crypto');
      const result = await getDecryptedApiKey('anthropic');
      expect(result).toBeNull();
    });

    it('throws when ENCRYPTION_KEY is not set', async () => {
      setupMocks({
        user: { id: 'user-123' },
        queryResult: { data: { encrypted_key: mockEncryptedKey }, error: null },
        envKey: '',
      });
      delete process.env.ENCRYPTION_KEY;

      const { getDecryptedApiKey } = await import('./crypto');
      await expect(getDecryptedApiKey('openai')).rejects.toThrow(
        'ENCRYPTION_KEY environment variable is not set'
      );
    });
  });
});
