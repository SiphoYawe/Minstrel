import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';

async function ErrorContent({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-sm text-muted-foreground">Error: {params.error}</p>
      ) : (
        <p className="text-sm text-muted-foreground">An unspecified error occurred.</p>
      )}
    </>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ error: string }> }) {
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
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent-warm">
            Authentication Error
          </p>
          <div className="mt-2 h-px w-12 bg-accent-warm" />
        </div>

        <p className="mb-4 text-lg text-foreground">Sorry, something went wrong.</p>

        <Suspense>
          <ErrorContent searchParams={searchParams} />
        </Suspense>

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
