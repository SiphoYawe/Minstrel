'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      // Redirect to login after successful password update
      router.push('/login?message=Password updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong — please try again.');
    } finally {
      setIsLoading(false);
    }
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
            New Password
          </p>
          <div className="mt-2 h-px w-12 bg-primary" />
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          Enter your new password below. Make sure it's at least 8 characters long.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="password" className="font-mono text-caption uppercase tracking-wider">
              New Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">At least 8 characters</p>
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

          {error && (
            <p className="text-caption text-accent-warm" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="mt-1 w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Updating...
              </span>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-caption text-muted-foreground">
          Remember your password?{' '}
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
