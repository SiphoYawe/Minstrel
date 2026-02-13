'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn({ email, password }, redirectTo ?? undefined);
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      }
      // On success, signIn navigates away — don't reset loading (component unmounts)
    } catch {
      setError('Something went wrong — please try again.');
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Header — equipment-label style */}
        <div className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
            Session Login
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
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="font-mono text-caption uppercase tracking-wider">
                Password
              </Label>
              <Link
                href="/auth/forgot-password"
                className="text-caption text-muted-foreground transition-colors duration-micro hover:text-primary"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-caption text-[#E8C77B]" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="mt-1 w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-pulse border border-primary-foreground" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-caption text-muted-foreground">
          No account yet?{' '}
          <Link
            href="/signup"
            className="text-primary transition-colors duration-micro hover:brightness-110"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <span className="font-mono text-caption text-muted-foreground">Loading...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
