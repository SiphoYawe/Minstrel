'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/features/auth';
import { mapSupabaseUser } from '@/features/auth/use-auth';
import { useAppStore } from '@/stores/app-store';
import { ApiKeyPrompt } from '@/features/auth/api-key-prompt';
import { getApiKeyMetadata, submitApiKey, deleteApiKey } from '@/features/auth/api-key-manager';
import type { ApiKeyMetadata, ApiKeyProvider } from '@/features/auth/auth-types';
import { TokenUsageDisplay } from '@/features/coaching/token-usage-display';
import { getTotalTokenUsage, getRecentSessionUsage } from '@/features/coaching/token-usage';
import type { TokenUsageSummary } from '@/features/coaching/token-usage';
import { exportUserData, downloadExportAsJson } from '@/features/auth/data-export';
import { LogoutConfirmationDialog } from '@/components/logout-confirmation-dialog';

const SECTIONS = [
  { id: 'api-keys', label: 'API Keys' },
  { id: 'profile', label: 'Profile' },
  { id: 'your-data', label: 'Your Data' },
  { id: 'account', label: 'Account' },
] as const;

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
  const [exportError, setExportError] = useState<string | null>(null);
  const hasApiKey = useAppStore((s) => s.hasApiKey);
  const [activeSection, setActiveSection] = useState<string>('api-keys');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Track active section based on scroll position using IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      Boolean
    ) as HTMLElement[];

    if (sections.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    sections.forEach((section) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      }, observerOptions);

      observer.observe(section);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [isAuthenticated]); // Re-run when auth state changes (sections mount)

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
    setExportError(null);
    try {
      const data = await exportUserData();
      downloadExportAsJson(data);
    } catch (err) {
      if (mountedRef.current) {
        setExportError(
          err instanceof Error ? err.message : 'Could not export your data. Please try again.'
        );
      }
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

  const handleSaveName = useCallback(async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setNameError('Display name cannot be empty.');
      return;
    }
    setIsSavingName(true);
    setNameError(null);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data, error } = await supabase.auth.updateUser({
        data: { display_name: trimmed },
      });
      if (!mountedRef.current) return;
      if (error) {
        setNameError(error.message);
        return;
      }
      if (data.user) {
        const mapped = mapSupabaseUser(data.user);
        useAppStore.getState().setUser(mapped);
      }
      setIsEditingName(false);
    } catch (err) {
      if (mountedRef.current) {
        setNameError(err instanceof Error ? err.message : 'Could not update name.');
      }
    } finally {
      if (mountedRef.current) setIsSavingName(false);
    }
  }, [editName]);

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
            className="flex items-center gap-0.5 text-caption text-muted-foreground transition-colors duration-150 hover:text-primary"
          >
            <ChevronLeft className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
            Back to practice
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
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Settings</p>
          <div className="mt-2 h-px w-12 bg-primary" />
        </div>

        {/* Section Navigation - Sticky */}
        <nav
          className="sticky top-0 z-10 -mx-6 mb-6 border-b border-border bg-background/80 px-6 backdrop-blur"
          aria-label="Settings sections"
        >
          <ul className="flex gap-6">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => scrollToSection(section.id)}
                  className={`relative block py-3 font-mono text-[11px] uppercase tracking-wider transition-colors duration-150 ${
                    activeSection === section.id
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-current={activeSection === section.id ? 'location' : undefined}
                >
                  {section.label}
                  {activeSection === section.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* API Keys section - First/Most Prominent */}
        <section id="api-keys" className="scroll-mt-16 border border-border p-6">
          <h2 className="font-mono text-caption uppercase tracking-wider text-muted-foreground">
            API Keys
          </h2>

          {/* Provider list with status indicators */}
          {keyMetadata && !isKeyLoading && !fetchError && (
            <div className="mt-4 border border-border bg-surface-light p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-foreground">
                    {keyMetadata.provider === 'openai'
                      ? 'OpenAI'
                      : keyMetadata.provider === 'anthropic'
                        ? 'Anthropic'
                        : 'Other'}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    ****{keyMetadata.lastFour}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wider ${
                      keyMetadata.status === 'active'
                        ? 'text-accent-success'
                        : keyMetadata.status === 'validating'
                          ? 'text-primary'
                          : 'text-accent-warm'
                    }`}
                  >
                    {keyMetadata.status}
                  </span>
                  <span className="border border-primary/30 bg-primary/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                    Default
                  </span>
                </div>
              </div>
            </div>
          )}

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

        {/* Profile section */}
        <section id="profile" className="mt-4 scroll-mt-16 border border-border p-6">
          <h2 className="font-mono text-caption uppercase tracking-wider text-muted-foreground">
            Profile
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</p>
              <p className="mt-1 font-mono text-sm text-foreground">{user.email}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Display Name
              </p>
              {isEditingName ? (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    className="flex-1 bg-surface-light border border-border px-2 py-1 font-mono text-sm text-foreground
                      focus:outline-none focus:border-primary/30 transition-colors"
                    aria-label="Display name"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="font-mono text-[11px] uppercase tracking-[0.1em]"
                  >
                    {isSavingName ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingName(false)}
                    disabled={isSavingName}
                    className="font-mono text-[11px] uppercase tracking-[0.1em]"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-mono text-sm text-foreground">
                    {user.displayName || 'Not set'}
                  </p>
                  <button
                    onClick={() => {
                      setEditName(user.displayName ?? '');
                      setIsEditingName(true);
                      setNameError(null);
                    }}
                    className="font-mono text-[10px] uppercase tracking-wider text-primary hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )}
              {nameError && <p className="mt-1 text-xs text-accent-warm">{nameError}</p>}
            </div>
          </div>
        </section>

        {/* Your Data section — GDPR export */}
        <section id="your-data" className="mt-4 scroll-mt-16 border border-border p-6">
          <h2 className="font-mono text-caption uppercase tracking-wider text-muted-foreground">
            Your Data
          </h2>
          <p className="mt-3 text-caption leading-relaxed text-muted-foreground">
            Export all your Minstrel data including practice sessions, progress metrics, AI
            conversations, achievements, and locally stored MIDI events. Your API keys are included
            as metadata only (provider and last four characters) &mdash; encrypted keys are never
            exported.
          </p>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Preparing export...' : 'Export My Data'}
          </Button>
          {exportError && <p className="mt-2 text-xs text-accent-warm">{exportError}</p>}
        </section>

        {/* Account Actions */}
        <section id="account" className="mt-8 scroll-mt-16 flex flex-col gap-4">
          <Button variant="outline" className="w-full" onClick={() => setShowLogoutDialog(true)}>
            Sign Out
          </Button>

          <div className="border-t border-border pt-6">
            <h2 className="font-mono text-caption uppercase tracking-wider text-accent-warm">
              Danger Zone
            </h2>
            <p className="mt-4 text-caption text-muted-foreground">
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

      <LogoutConfirmationDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={signOut}
      />
    </div>
  );
}
