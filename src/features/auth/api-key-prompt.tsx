'use client';

import { useState, useId } from 'react';
import { z } from 'zod/v4';
import { Loader2, ExternalLink } from 'lucide-react';

import { capture } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import type { ApiKeyMetadata, ApiKeyProvider } from './auth-types';
import { apiKeySubmitSchema } from './auth-types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDER_DISPLAY_NAMES: Record<ApiKeyProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  other: 'Other',
};

const PROVIDER_KEY_PREFIXES: Record<ApiKeyProvider, string> = {
  openai: 'sk-',
  anthropic: 'sk-ant-',
  other: '',
};

const PROVIDER_LINKS: Partial<Record<ApiKeyProvider, { label: string; href: string }>> = {
  openai: { label: 'OpenAI API Keys', href: 'https://platform.openai.com/api-keys' },
  anthropic: {
    label: 'Anthropic API Keys',
    href: 'https://console.anthropic.com/settings/keys',
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ApiKeyPromptProps {
  keyMetadata: ApiKeyMetadata | null;
  onSave: (provider: ApiKeyProvider, apiKey: string) => Promise<void>;
  onDelete: (provider: ApiKeyProvider) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApiKeyPrompt({
  keyMetadata,
  onSave,
  onDelete,
  isSubmitting,
  submitError,
}: ApiKeyPromptProps) {
  const [provider, setProvider] = useState<ApiKeyProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const errorId = useId();
  const isFormMode = !keyMetadata || isEditing;

  // ---- handlers ----

  function handleProviderChange(value: string) {
    setProvider(value as ApiKeyProvider);
    setValidationError(null);
  }

  async function handleSave() {
    setValidationError(null);

    const result = apiKeySubmitSchema.safeParse({ provider, apiKey });
    if (!result.success) {
      const firstIssue = z.prettifyError(result.error).split('\n')[0];
      setValidationError(firstIssue ?? 'Invalid input.');
      return;
    }

    try {
      await onSave(result.data.provider, result.data.apiKey);
      // If onSave succeeds (no throw), reset local state and track
      capture('api_key_saved', { provider: result.data.provider });
      setApiKey('');
      setIsEditing(false);
      setValidationError(null);
    } catch {
      // Error is already displayed via submitError prop from the parent
    }
  }

  function handleStartEditing() {
    setIsEditing(true);
    setApiKey('');
    setValidationError(null);
    if (keyMetadata) {
      setProvider(keyMetadata.provider);
    }
  }

  function handleCancelEditing() {
    setIsEditing(false);
    setApiKey('');
    setValidationError(null);
  }

  async function handleDelete() {
    if (!keyMetadata) return;
    await onDelete(keyMetadata.provider);
    capture('api_key_removed', { provider: keyMetadata.provider });
    setIsEditing(false);
    setApiKey('');
  }

  // ---- derived ----

  const displayError = validationError ?? submitError;
  const placeholderHint = PROVIDER_KEY_PREFIXES[provider]
    ? `${PROVIDER_KEY_PREFIXES[provider]}...`
    : 'Paste your API key';

  // ---- display mode ----

  if (!isFormMode && keyMetadata) {
    const providerName = PROVIDER_DISPLAY_NAMES[keyMetadata.provider];
    const prefix = PROVIDER_KEY_PREFIXES[keyMetadata.provider];
    const maskedKey = prefix
      ? `${providerName}: ${prefix}...${keyMetadata.lastFour}`
      : `${providerName}: ...${keyMetadata.lastFour}`;

    const statusConfig = {
      active: {
        label: 'Active',
        color: 'hsl(var(--accent-success))',
        bg: 'hsl(var(--accent-success) / 0.15)',
      },
      validating: {
        label: 'Validating',
        color: 'hsl(var(--primary))',
        bg: 'hsl(var(--primary) / 0.15)',
      },
      invalid: {
        label: 'Invalid',
        color: 'hsl(var(--accent-warm))',
        bg: 'hsl(var(--accent-warm) / 0.15)',
      },
    }[keyMetadata.status];

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-sm text-foreground"
              style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)' }}
            >
              {maskedKey}
            </span>
            <Badge
              className="text-[11px] uppercase tracking-wider"
              style={{
                backgroundColor: statusConfig.bg,
                color: statusConfig.color,
                borderColor: statusConfig.color,
              }}
            >
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleStartEditing}>
            Update Key
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-accent-warm hover:text-accent-warm">
                Remove Key
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove API Key</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove your API key? AI features will be disabled.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-accent-warm text-primary-foreground hover:brightness-110"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  }

  // ---- form mode ----

  return (
    <div className="flex flex-col gap-5">
      {/* BYOK onboarding text — only when there is no key at all */}
      {!keyMetadata && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground" style={{ lineHeight: '1.6' }}>
            Minstrel uses a Bring-Your-Own-Key model. Provide your LLM API key to unlock AI coaching
            features. Your key is encrypted and never shared.
          </p>
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider">
            {Object.entries(PROVIDER_LINKS).map(([key, link]) =>
              link ? (
                <a
                  key={key}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {link.label}
                  <ExternalLink className="size-3" />
                </a>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Provider selector */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="provider-select"
          className="text-[11px] uppercase tracking-wider text-muted-foreground"
          style={{ fontFamily: 'var(--font-sans, Inter, sans-serif)' }}
        >
          Provider
        </label>
        <Select value={provider} onValueChange={handleProviderChange}>
          <SelectTrigger id="provider-select" className="w-full bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="anthropic">Anthropic</SelectItem>
            <SelectItem value="other">Other Provider</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* API key input */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="api-key-input"
          className="text-[11px] uppercase tracking-wider text-muted-foreground"
          style={{ fontFamily: 'var(--font-sans, Inter, sans-serif)' }}
        >
          API Key
        </label>
        <Input
          id="api-key-input"
          type="password"
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setValidationError(null);
          }}
          placeholder={placeholderHint}
          aria-label={`${PROVIDER_DISPLAY_NAMES[provider]} API key`}
          aria-describedby={displayError ? errorId : undefined}
          aria-invalid={!!displayError}
          className="bg-card font-mono"
          style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)' }}
          disabled={isSubmitting}
          autoComplete="off"
        />

        {/* Inline error */}
        {displayError && (
          <p id={errorId} className="text-xs text-accent-warm" role="alert">
            {displayError}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleSave}
          disabled={isSubmitting || apiKey.length === 0}
          className="bg-primary text-primary-foreground hover:brightness-110"
          size="sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Key'
          )}
        </Button>

        {isEditing && (
          <Button variant="ghost" size="sm" onClick={handleCancelEditing} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
