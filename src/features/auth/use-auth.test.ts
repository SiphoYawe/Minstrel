import { describe, it, expect } from 'vitest';
import { validateSignUp, validateSignIn } from './use-auth';

describe('validateSignUp', () => {
  const validData = {
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    dateOfBirth: '2000-01-01',
  };

  it('returns null for valid data', () => {
    expect(validateSignUp(validData)).toBeNull();
  });

  it('rejects empty email', () => {
    expect(validateSignUp({ ...validData, email: '' })).toContain('email');
  });

  it('rejects email without @', () => {
    expect(validateSignUp({ ...validData, email: 'notanemail' })).toContain('email');
  });

  it('rejects short password', () => {
    const result = validateSignUp({ ...validData, password: 'short', confirmPassword: 'short' });
    expect(result).toContain('8 characters');
  });

  it('rejects mismatched passwords', () => {
    const result = validateSignUp({ ...validData, confirmPassword: 'different123' });
    expect(result).toContain('match');
  });

  it('rejects missing date of birth', () => {
    const result = validateSignUp({ ...validData, dateOfBirth: '' });
    expect(result).toContain('Date of birth');
  });

  it('rejects users under 13 (COPPA)', () => {
    const today = new Date();
    const underAge = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    const result = validateSignUp({
      ...validData,
      dateOfBirth: underAge.toISOString().split('T')[0],
    });
    expect(result).toContain('13 years old');
  });

  it('accepts users exactly 13 years old', () => {
    const today = new Date();
    const exactly13 = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    const result = validateSignUp({
      ...validData,
      dateOfBirth: exactly13.toISOString().split('T')[0],
    });
    expect(result).toBeNull();
  });

  it('accepts users over 13', () => {
    const result = validateSignUp({ ...validData, dateOfBirth: '1990-06-15' });
    expect(result).toBeNull();
  });

  it('rejects users who are 12 and 364 days old', () => {
    const today = new Date();
    const almostThirteen = new Date(
      today.getFullYear() - 13,
      today.getMonth(),
      today.getDate() + 1
    );
    const result = validateSignUp({
      ...validData,
      dateOfBirth: almostThirteen.toISOString().split('T')[0],
    });
    expect(result).toContain('13 years old');
  });
});

describe('validateSignIn', () => {
  it('returns null for valid data', () => {
    expect(validateSignIn({ email: 'test@example.com', password: 'password' })).toBeNull();
  });

  it('rejects empty email', () => {
    expect(validateSignIn({ email: '', password: 'password' })).toContain('email');
  });

  it('rejects email without @', () => {
    expect(validateSignIn({ email: 'bad', password: 'password' })).toContain('email');
  });

  it('rejects empty password', () => {
    expect(validateSignIn({ email: 'test@example.com', password: '' })).toContain('Password');
  });
});
