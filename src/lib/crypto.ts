import crypto from 'node:crypto';

// Ensure this module is only used server-side
if (typeof window !== 'undefined') {
  throw new Error('crypto module must only be imported in server-side code');
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT = 'minstrel-api-key-encryption-v1';

// Cache derived key to avoid repeated scryptSync (CPU-intensive) on every call
let cachedKeySource: string | null = null;
let cachedDerivedKey: Buffer | null = null;

function deriveKey(encryptionKey: string): Buffer {
  if (cachedKeySource === encryptionKey && cachedDerivedKey) {
    return cachedDerivedKey;
  }
  const derived = crypto.scryptSync(encryptionKey, SALT, KEY_LENGTH);
  cachedKeySource = encryptionKey;
  cachedDerivedKey = derived;
  return derived;
}

export function encrypt(plaintext: string, encryptionKey: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string');
  }
  if (!encryptionKey || encryptionKey.length < 32) {
    throw new Error('Encryption key must be at least 32 characters');
  }

  const key = deriveKey(encryptionKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decrypt(encryptedString: string, encryptionKey: string): string {
  if (!encryptedString) {
    throw new Error('Cannot decrypt empty string');
  }
  if (!encryptionKey || encryptionKey.length < 32) {
    throw new Error('Encryption key must be at least 32 characters');
  }

  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }

  const [ivBase64, authTagBase64, ciphertextBase64] = parts;
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');

  const key = deriveKey(encryptionKey);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

export async function getDecryptedApiKey(provider: string): Promise<string | null> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  // Derive userId from the authenticated session (RLS enforces auth.uid() = user_id)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_api_keys')
    .select('encrypted_key')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    return null;
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  return decrypt(data.encrypted_key, encryptionKey);
}
