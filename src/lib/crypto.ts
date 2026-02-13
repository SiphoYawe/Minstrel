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
const MIN_ENTROPY_BITS = 3.0;

/**
 * Calculate Shannon entropy of a string in bits per character.
 * Formula: -Σ(p(x) * log2(p(x)))
 */
export function calculateShannonEntropy(key: string): number {
  if (!key || key.length === 0) return 0;

  const freq = new Map<string, number>();
  for (const char of key) {
    freq.set(char, (freq.get(char) ?? 0) + 1);
  }

  let entropy = 0;
  const len = key.length;
  for (const count of freq.values()) {
    const p = count / len;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

function validateKeyEntropy(encryptionKey: string): void {
  const entropy = calculateShannonEntropy(encryptionKey);
  if (entropy < MIN_ENTROPY_BITS) {
    throw new Error(
      `Encryption key has insufficient entropy: ${entropy.toFixed(2)} bits/char (minimum: ${MIN_ENTROPY_BITS}). Use a cryptographically random key.`
    );
  }
}

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

const CURRENT_KEY_VERSION = parseInt(process.env.ENCRYPTION_KEY_VERSION ?? '1', 10);

export interface VersionedEncryptedData {
  version: number;
  data: string;
}

export function encrypt(plaintext: string, encryptionKey: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string');
  }
  if (!encryptionKey || encryptionKey.length < 32) {
    throw new Error('Encryption key must be at least 32 characters');
  }
  validateKeyEntropy(encryptionKey);

  const key = deriveKey(encryptionKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const ciphertext = `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;

  const versioned: VersionedEncryptedData = {
    version: CURRENT_KEY_VERSION,
    data: ciphertext,
  };

  return JSON.stringify(versioned);
}

export function decrypt(encryptedString: string, encryptionKey: string): string {
  if (!encryptedString) {
    throw new Error('Cannot decrypt empty string');
  }
  if (!encryptionKey || encryptionKey.length < 32) {
    throw new Error('Encryption key must be at least 32 characters');
  }
  validateKeyEntropy(encryptionKey);

  // Support both versioned JSON format and legacy colon-delimited format
  let ciphertextRaw: string;
  try {
    const parsed = JSON.parse(encryptedString) as VersionedEncryptedData;
    if (parsed.version && parsed.data) {
      ciphertextRaw = parsed.data;
    } else {
      ciphertextRaw = encryptedString;
    }
  } catch {
    // Legacy format: iv:authTag:ciphertext
    ciphertextRaw = encryptedString;
  }

  const parts = ciphertextRaw.split(':');
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
