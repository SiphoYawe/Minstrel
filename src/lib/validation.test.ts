import { describe, it, expect } from 'vitest';
import { isValidUUID, uuidSchema } from './validation';

describe('isValidUUID', () => {
  it('accepts a valid UUID v4', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('accepts a valid UUID with lowercase letters', () => {
    expect(isValidUUID('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidUUID('')).toBe(false);
  });

  it('rejects a non-UUID string', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
  });

  it('rejects a string with wrong format', () => {
    expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false);
  });

  it('rejects a string with extra characters', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000-extra')).toBe(false);
  });

  it('rejects undefined/null-like values when cast to string', () => {
    expect(isValidUUID('undefined')).toBe(false);
    expect(isValidUUID('null')).toBe(false);
  });
});

describe('uuidSchema', () => {
  it('parses a valid UUID successfully', () => {
    const result = uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(true);
  });

  it('fails for an invalid UUID', () => {
    const result = uuidSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });

  it('fails for non-string inputs', () => {
    const result = uuidSchema.safeParse(123);
    expect(result.success).toBe(false);
  });
});
