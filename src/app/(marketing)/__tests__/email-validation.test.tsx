import { describe, it, expect } from 'vitest';

/**
 * Email validation function used across auth pages
 */
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  return regex.test(email);
}

describe('Email Validation', () => {
  it('accepts valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('test.user@example.com')).toBe(true);
    expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
    expect(isValidEmail('user_name@sub.domain.com')).toBe(true);
  });

  it('rejects emails without @ symbol', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
    expect(isValidEmail('user.example.com')).toBe(false);
  });

  it('rejects emails without domain part', () => {
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user@.')).toBe(false);
  });

  it('rejects emails without TLD', () => {
    expect(isValidEmail('user@example')).toBe(false);
    expect(isValidEmail('user@example.')).toBe(false);
  });

  it('rejects emails with TLD shorter than 2 characters', () => {
    expect(isValidEmail('user@example.c')).toBe(false);
  });

  it('rejects emails with spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
    expect(isValidEmail('user@ example.com')).toBe(false);
    expect(isValidEmail('user@exam ple.com')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects invalid formats', () => {
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('user@@example.com')).toBe(false);
    expect(isValidEmail('user@example@com')).toBe(false);
  });
});
