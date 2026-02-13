# Story 18.2: Harden Encryption Key Validation

Status: ready-for-dev

## Story

As a security-conscious developer,
I want encryption keys validated for entropy and versioned for rotation,
So that API keys and sensitive data are protected against brute force attacks and key management is future-proof.

## Acceptance Criteria

1. Given an encryption key is provided at startup, When the key has insufficient entropy (e.g., all same character, sequential), Then startup fails with a clear error message
2. Given a valid high-entropy encryption key, When validation runs, Then the key passes and the application starts normally
3. Given encryption key metadata, When stored, Then a `keyVersion` field is included to support future key rotation
4. Given the entropy check, When validating, Then it uses Shannon entropy calculation with a minimum threshold of 3.0 bits per character

## Tasks / Subtasks

1. Add `calculateShannonEntropy(key: string): number` function to `src/lib/crypto.ts`
   - Formula: `-Σ(p(x) * log2(p(x)))` where p(x) is character frequency
   - Return entropy in bits per character
2. Update key validation to check entropy
   - Minimum threshold: 3.0 bits per character
   - Clear error message on failure with entropy value
3. Add key version support
   - Add `ENCRYPTION_KEY_VERSION=1` to `.env.example`
   - Update encrypted data schema to include `{ version: 1, data: string }`
4. Add unit tests
   - Key `"a".repeat(32)` → entropy 0.0 → startup fails
   - Key `"password123password123password"` → low entropy → startup fails
   - Key from `crypto.randomBytes(32).toString('hex')` → high entropy → passes
   - Encrypted data includes `{ version: 1, ... }` wrapper

## Dev Notes

**Architecture Layer**: Infrastructure Layer (crypto)
**Findings Covered**: SEC-C2
**File**: `src/lib/crypto.ts` (lines 32-34, 52-54)
**Current State**: Validation only checks length (≥32 chars) but doesn't verify entropy. Weak keys like `"a".repeat(32)` pass.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
