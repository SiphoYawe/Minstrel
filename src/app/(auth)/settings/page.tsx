'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/features/auth';
import { useAppStore } from '@/stores/app-store';
import { ApiKeyPrompt } from '@/features/auth/api-key-prompt';
import { getApiKeyMetadata, submitApiKey, deleteApiKey } from '@/features/auth/api-key-manager';
import type { ApiKeyMetadata, ApiKeyProvider } from '@/features/auth/auth-types';
import { TokenUsageDisplay } from '@/features/coaching/token-usage-display';
import { getTotalTokenUsage, getRecentSessionUsage } from '@/features/coaching/token-usage';
import type { TokenUsageSummary } from '@/features/coaching/token-usage';

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const mountedRef = useRef(true);

  const [keyMetadata, setKeyMetadata] = useState<ApiKeyMetadata | null>(null);
  const [isKeyLoading, setIsKeyLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [totalUsage, setTotalUsage] = useState<TokenUsageSummary | null>(null);
  const [recentUsage, setRecentUsage] = useState<TokenUsageSummary | null>(null);
  const [usageLoaded, setUsageLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const hasApiKey = useAppStore((s) => s.hasApiKey);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch existing key metadata on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    getApiKeyMetadata().then((result) => {
      if (cancelled) return;
      if (result.error) {
        setFetchError(result.error.message);
        // Don't touch hasApiKey on fetch error — keep stale state
      } else if (result.data) {
        setKeyMetadata(result.data);
        useAppStore.getState().setHasApiKey(true);
        useAppStore.getState().setApiKeyProvider(result.data.provider);
      } else {
        setKeyMetadata(null);
        useAppStore.getState().setHasApiKey(false);
        useAppStore.getState().setApiKeyProvider(null);
      }
      setIsKeyLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Fetch token usage when authenticated and has API key
  useEffect(() => {
    if (!isAuthenticated || !user || !hasApiKey) return;
    let cancelled = false;
    Promise.all([getTotalTokenUsage(user.id), getRecentSessionUsage(user.id)])
      .then(([total, recent]) => {
        if (cancelled) return;
        setTotalUsage(total);
        setRecentUsage(recent);
      })
      .catch(() => {
        // Usage fetch is non-critical — silently degrade to empty state
      })
      .finally(() => {
        if (!cancelled) setUsageLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, hasApiKey]);

  const handleSaveKey = useCallback(async (provider: ApiKeyProvider, apiKey: string) => {
    setIsSubmitting(true);
    setSubmitError(null);
    const result = await submitApiKey(provider, apiKey);
    if (!mountedRef.current) return;
    setIsSubmitting(false);
    if (result.error) {
      setSubmitError(result.error.message);
      return;
    }
    setKeyMetadata(result.data);
    useAppStore.getState().setHasApiKey(true);
    if (result.data) {
      useAppStore.getState().setApiKeyProvider(result.data.provider);
    }
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/user/export');
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `minstrel-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      if (mountedRef.current) setIsExporting(false);
    }
  }, []);

  const handleDeleteKey = useCallback(async (provider: ApiKeyProvider) => {
    setIsSubmitting(true);
    setSubmitError(null);
    const result = await deleteApiKey(provider);
    if (!mountedRef.current) return;
    setIsSubmitting(false);
    if (result.error) {
      setSubmitError(result.error.message);
      return;
    }
    setKeyMetadata(null);
    useAppStore.getState().setHasApiKey(false);
    useAppStore.getState().setApiKeyProvider(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <span className="font-mono text-caption text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            You need to be signed in to view settings.
          </p>
          <Link
            href="/login?redirectTo=/settings"
            className="mt-4 inline-block text-caption text-primary transition-colors duration-micro hover:brightness-110"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background px-6 py-8">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="sr-only">Settings</h1>
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/session"
            className="text-caption text-muted-foreground transition-colors duration-150 hover:text-[#7CB9E8]"
          >
            &larr; Back to practice
          </Link>
          <Link href="/" className="transition-opacity duration-150 hover:opacity-70">
            <Image
              src="/minstrel-logo-white.svg"
              alt="Minstrel"
              width={80}
              height={20}
              className="h-4 w-auto opacity-30"
            />
          </Link>
        </div>

        {/* Page header */}
        <div className="mt-6 mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#7CB9E8]">
            Settings
          </p>
          <div className="mt-2 h-px w-12 bg-[#7CB9E8]" />
        </div>

        {/* Profile section */}
        <section className="border border-border p-6">
          <h2 className="font-mono text-caption uppercase tracking-wider text-muted-foreground">
            Profile
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</p>
              <p className="mt-1 font-mono text-sm text-foreground">{user.email}</p>
            </div>
            {user.displayName && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Display Name
                </p>
                <p className="mt-1 font-mono text-sm text-foreground">{user.displayName}</p>
              </div>
            )}
          </div>
        </section>

        {/* API Keys section */}
        <section id="api-keys" className="mt-4 scroll-mt-8 border border-border p-6">
          <h2 className="font-mono text-caption uppercase tracking-wider text-muted-foreground">
            API Keys
          </h2>
          <div className="mt-4">
            {isKeyLoading ? (
              <span className="font-mono text-caption text-muted-foreground">Loading...</span>
            ) : fetchError ? (
              <p className="text-xs text-accent-warm">Could not load API key info. {fetchError}</p>
            ) : (
              <ApiKeyPrompt
                keyMetadata={keyMetadata}
                onSave={handleSaveKey}
                onDelete={handleDeleteKey}
                isSubmitting={isSubmitting}
                submitError={submitError}
              />
            )}
          </div>

          {/* Usage Summary — only shown when user has an API key */}
          {hasApiKey && (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Usage Summary
              </h3>
              <div className="mt-3 space-y-4">
                {!usageLoaded ? (
                  <span className="font-mono text-caption text-muted-foreground">
                    Loading usage...
                  </span>
                ) : (
                  <>
                    <TokenUsageDisplay summary={totalUsage} variant="total" />
                    {recentUsage && (
                      <div>
                        <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                          Most Recent Session
                        </p>
                        <TokenUsageDisplay summary={recentUsage} variant="session" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Preferences section */}
        <section className="mt-4 border border-border p-6">
          <h2 className="font-mono text-caption uppercase tracking-wider text-muted-foreground">
            Preferences
          </h2>
          <p className="mt-3 text-caption text-muted-foreground">
            Personalization options &mdash; coming soon
          </p>
        </section>

        {/* Actions */}
        <section className="mt-8 flex flex-col gap-4">
          <Button variant="outline" className="w-full" onClick={signOut}>
            Sign Out
          </Button>

          <div className="border-t border-border pt-6">
            <h2 className="font-mono text-caption uppercase tracking-wider text-accent-warm">
              Danger Zone
            </h2>

            <div className="mt-4">
              <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Export Data
              </h3>
              <p className="mt-1 text-caption text-muted-foreground">
                Download all your practice sessions, progress metrics, and AI conversations as JSON.
              </p>
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? 'Preparing export...' : 'Download My Data'}
              </Button>
            </div>

            <p className="mt-6 text-caption text-muted-foreground">
              Account deletion — coming in a future update. Contact{' '}
              <a
                href="mailto:support@minstrel.app"
                className="text-primary transition-colors hover:brightness-110"
              >
                support@minstrel.app
              </a>{' '}
              for removal requests.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
