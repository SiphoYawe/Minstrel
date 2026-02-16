'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth, validateSignUp } from '@/features/auth';
import { PasswordStrengthIndicator } from '@/components/password-strength-indicator';
import { Loader2 } from 'lucide-react';

function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  return regex.test(email);
}

export default function SignupPage() {
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleEmailBlur() {
    if (email && !isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEmailError(null);

    // Client-side password strength check
    if (password.length > 0 && password.length < 8) {
      setError('Password must be at least 8 characters.');
      setIsLoading(false);
      return;
    }

    const validationError = validateSignUp({ email, password, confirmPassword, dateOfBirth });
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      const result = await signUp({ email, password, confirmPassword, dateOfBirth });
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100svh-3.5rem)] w-full items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-12 inline-block transition-opacity duration-150 hover:opacity-70"
          >
            <Image
              src="/minstrel-logo-white.svg"
              alt="Minstrel"
              width={100}
              height={25}
              className="h-5 w-auto opacity-40"
            />
          </Link>

          <div className="mb-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent-success">
              Account Created
            </p>
            <div className="mt-2 h-px w-12 bg-accent-success" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Check your email to confirm your account. Once verified, you can sign in and start
            practicing.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-11 w-full items-center justify-center border border-surface-border bg-background text-sm font-medium text-foreground transition-colors duration-150 hover:bg-card"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] w-full items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link
          href="/"
          className="mb-12 inline-block transition-opacity duration-150 hover:opacity-70"
        >
          <Image
            src="/minstrel-logo-white.svg"
            alt="Minstrel"
            width={100}
            height={25}
            className="h-5 w-auto opacity-40"
          />
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
            New Account
          </p>
          <div className="mt-2 h-px w-12 bg-primary" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="email" className="font-mono text-caption uppercase tracking-wider">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'email-error' : undefined}
            />
            {emailError && (
              <p id="email-error" className="text-caption text-accent-warm" role="alert">
                {emailError}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password" className="font-mono text-caption uppercase tracking-wider">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password.length > 0 && (
              <PasswordStrengthIndicator password={password} className="mt-2" />
            )}
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="confirm-password"
              className="font-mono text-caption uppercase tracking-wider"
            >
              Confirm Password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="date-of-birth"
              className="font-mono text-caption uppercase tracking-wider"
            >
              Date of Birth
            </Label>
            <Input
              id="date-of-birth"
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="[color-scheme:dark]"
            />
            <p className="text-[11px] text-muted-foreground">You must be at least 13 years old</p>
          </div>

          {error && (
            <p className="text-caption text-accent-warm" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="mt-1 w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-caption text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-primary transition-colors duration-150 hover:brightness-110"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
