'use client';

import { useState, useId } from 'react';
import { Loader2, ExternalLink, Check, X } from 'lucide-react';

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
import { validateApiKeyFormat } from './api-key-manager';

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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Validation stages tracking
  type StageState = 'idle' | 'pending' | 'complete' | 'error';
  const [formatStage, setFormatStage] = useState<StageState>('idle');
  const [providerStage, setProviderStage] = useState<StageState>('idle');

  const errorId = useId();
  const isFormMode = !keyMetadata || isEditing;
  const showValidationStages = isSubmitting || formatStage !== 'idle' || providerStage !== 'idle';

  // ---- handlers ----

  function handleProviderChange(value: ApiKeyProvider) {
    setProvider(value);
    setValidationError(null);
  }

  function handleNextStep() {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  }

  function handlePrevStep() {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  }

  async function handleSave() {
    setValidationError(null);
    setFormatStage('idle');
    setProviderStage('idle');

    // Stage 1: Format validation
    setFormatStage('pending');
    const formatValidation = validateApiKeyFormat(provider, apiKey);
    if (!formatValidation.valid) {
      setFormatStage('error');
      setValidationError(formatValidation.error ?? 'Invalid API key format.');
      return;
    }
    setFormatStage('complete');

    // Stage 2: Provider validation (via API)
    setProviderStage('pending');
    try {
      await onSave(provider, apiKey);
      // If onSave succeeds (no throw), mark as complete and reset state
      setProviderStage('complete');
      capture('api_key_saved', { provider });
      // Small delay to show the success state before clearing
      setTimeout(() => {
        setApiKey('');
        setIsEditing(false);
        setValidationError(null);
        setFormatStage('idle');
        setProviderStage('idle');
      }, 800);
    } catch {
      // Error is already displayed via submitError prop from the parent
      setProviderStage('error');
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
    setCurrentStep(1);
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

  // When editing existing key, show simplified form (not wizard)
  if (isEditing && keyMetadata) {
    return (
      <div className="flex flex-col gap-5">
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

          {/* Validation stages indicator */}
          {showValidationStages && (
            <div
              className="flex flex-col gap-2 border border-border bg-surface-light p-3"
              role="status"
              aria-live="polite"
            >
              {/* Format stage */}
              <div className="flex items-center gap-2">
                {formatStage === 'pending' && (
                  <Loader2 className="size-3 animate-spin text-primary" />
                )}
                {formatStage === 'complete' && <Check className="size-3 text-accent-success" />}
                {formatStage === 'error' && <X className="size-3 text-accent-warm" />}
                {formatStage === 'idle' && <div className="size-3 border border-border bg-card" />}
                <span
                  className={`font-mono text-[11px] uppercase tracking-wider ${
                    formatStage === 'complete'
                      ? 'text-accent-success'
                      : formatStage === 'error'
                        ? 'text-accent-warm'
                        : formatStage === 'pending'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                  }`}
                >
                  Checking format
                </span>
              </div>

              {/* Provider stage */}
              <div className="flex items-center gap-2">
                {providerStage === 'pending' && (
                  <Loader2 className="size-3 animate-spin text-primary" />
                )}
                {providerStage === 'complete' && <Check className="size-3 text-accent-success" />}
                {providerStage === 'error' && <X className="size-3 text-accent-warm" />}
                {providerStage === 'idle' && (
                  <div className="size-3 border border-border bg-card" />
                )}
                <span
                  className={`font-mono text-[11px] uppercase tracking-wider ${
                    providerStage === 'complete'
                      ? 'text-accent-success'
                      : providerStage === 'error'
                        ? 'text-accent-warm'
                        : providerStage === 'pending'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                  }`}
                >
                  Validating with {PROVIDER_DISPLAY_NAMES[provider]}
                </span>
              </div>

              {/* Active badge */}
              <div className="flex items-center gap-2">
                {providerStage === 'complete' && (
                  <>
                    <Check className="size-3 text-accent-success" />
                    <span className="font-mono text-[11px] uppercase tracking-wider text-accent-success">
                      Active
                    </span>
                  </>
                )}
                {providerStage !== 'complete' && (
                  <>
                    <div className="size-3 border border-border bg-card" />
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      Active
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

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

          <Button variant="ghost" size="sm" onClick={handleCancelEditing} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // ---- wizard mode (initial setup, no existing key) ----

  return (
    <div className="flex flex-col gap-6">
      {/* BYOK intro text */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground" style={{ lineHeight: '1.6' }}>
          Minstrel uses a Bring-Your-Own-Key model. Provide your LLM API key to unlock AI coaching
          features. Your key is encrypted and never shared.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex size-8 items-center justify-center text-xs font-medium ${
                step === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : step < currentStep
                    ? 'bg-primary/30 text-primary'
                    : 'bg-card text-muted-foreground'
              }`}
              style={{
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              }}
            >
              {step}
            </div>
            {step < 3 && (
              <div className={`h-[2px] w-8 ${step < currentStep ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="flex flex-col gap-5">
        {/* Step 1: Choose Provider */}
        {currentStep === 1 && (
          <>
            <div className="flex flex-col gap-2">
              <h3
                className="text-[11px] uppercase tracking-wider text-muted-foreground"
                style={{ fontFamily: 'var(--font-sans, Inter, sans-serif)' }}
              >
                Step 1: Choose Provider
              </h3>
              <p className="text-xs text-muted-foreground">
                Select your AI provider. We support OpenAI and Anthropic.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleProviderChange('openai')}
                className={`flex flex-col gap-1 p-4 text-left transition-colors ${
                  provider === 'openai'
                    ? 'border-2 border-primary bg-primary/5'
                    : 'border-2 border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="font-medium text-foreground">OpenAI</div>
                <div className="text-xs text-muted-foreground">
                  GPT-4, GPT-3.5-turbo models. Best for conversational AI coaching.
                </div>
              </button>

              <button
                onClick={() => handleProviderChange('anthropic')}
                className={`flex flex-col gap-1 p-4 text-left transition-colors ${
                  provider === 'anthropic'
                    ? 'border-2 border-primary bg-primary/5'
                    : 'border-2 border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="font-medium text-foreground">Anthropic</div>
                <div className="text-xs text-muted-foreground">
                  Claude models. Extended context, precise technical feedback.
                </div>
              </button>

              <button
                onClick={() => handleProviderChange('other')}
                className={`flex flex-col gap-1 p-4 text-left transition-colors ${
                  provider === 'other'
                    ? 'border-2 border-primary bg-primary/5'
                    : 'border-2 border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="font-medium text-foreground">Other Provider</div>
                <div className="text-xs text-muted-foreground">
                  OpenAI-compatible API (Groq, OpenRouter, local models).
                </div>
              </button>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleNextStep} size="sm">
                Next
              </Button>
            </div>
          </>
        )}

        {/* Step 2: Get Your Key */}
        {currentStep === 2 && (
          <>
            <div className="flex flex-col gap-2">
              <h3
                className="text-[11px] uppercase tracking-wider text-muted-foreground"
                style={{ fontFamily: 'var(--font-sans, Inter, sans-serif)' }}
              >
                Step 2: Get Your Key
              </h3>
              <p className="text-xs text-muted-foreground">
                Follow these instructions to create your API key.
              </p>
            </div>

            {provider === 'openai' && (
              <div className="flex flex-col gap-4 border-2 border-border bg-card p-4">
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium">OpenAI API Key</div>
                  <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                    <li>Go to platform.openai.com</li>
                    <li>Sign in or create an account</li>
                    <li>Navigate to API Keys section</li>
                    <li>Click &ldquo;Create new secret key&rdquo;</li>
                    <li>Copy the key (starts with sk-)</li>
                  </ol>
                </div>
                <a
                  href={PROVIDER_LINKS.openai?.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary hover:underline"
                >
                  Open OpenAI Platform
                  <ExternalLink className="size-3" />
                </a>
              </div>
            )}

            {provider === 'anthropic' && (
              <div className="flex flex-col gap-4 border-2 border-border bg-card p-4">
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium">Anthropic API Key</div>
                  <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                    <li>Go to console.anthropic.com</li>
                    <li>Sign in or create an account</li>
                    <li>Navigate to Settings → API Keys</li>
                    <li>Click &ldquo;Create Key&rdquo;</li>
                    <li>Copy the key (starts with sk-ant-)</li>
                  </ol>
                </div>
                <a
                  href={PROVIDER_LINKS.anthropic?.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary hover:underline"
                >
                  Open Anthropic Console
                  <ExternalLink className="size-3" />
                </a>
              </div>
            )}

            {provider === 'other' && (
              <div className="flex flex-col gap-4 border-2 border-border bg-card p-4">
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium">Other Providers</div>
                  <p className="text-xs text-muted-foreground">
                    Minstrel supports any OpenAI-compatible API endpoint. Supported providers:
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                    <li>Groq (fast inference, groq.com)</li>
                    <li>OpenRouter (multi-model access, openrouter.ai)</li>
                    <li>Together AI (open source models, together.ai)</li>
                    <li>Local models via Ollama or LM Studio</li>
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    Provide your API key and configure the base URL in settings after setup.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handlePrevStep} size="sm">
                Back
              </Button>
              <Button onClick={handleNextStep} size="sm">
                Next
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Enter Key */}
        {currentStep === 3 && (
          <>
            <div className="flex flex-col gap-2">
              <h3
                className="text-[11px] uppercase tracking-wider text-muted-foreground"
                style={{ fontFamily: 'var(--font-sans, Inter, sans-serif)' }}
              >
                Step 3: Enter Key
              </h3>
              <p className="text-xs text-muted-foreground">
                Paste your API key below. It will be encrypted and stored securely.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="api-key-input"
                className="text-[11px] uppercase tracking-wider text-muted-foreground"
                style={{ fontFamily: 'var(--font-sans, Inter, sans-serif)' }}
              >
                {PROVIDER_DISPLAY_NAMES[provider]} API Key
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

              {/* Validation stages indicator */}
              {showValidationStages && (
                <div
                  className="flex flex-col gap-2 border border-border bg-surface-light p-3"
                  role="status"
                  aria-live="polite"
                >
                  {/* Format stage */}
                  <div className="flex items-center gap-2">
                    {formatStage === 'pending' && (
                      <Loader2 className="size-3 animate-spin text-primary" />
                    )}
                    {formatStage === 'complete' && <Check className="size-3 text-accent-success" />}
                    {formatStage === 'error' && <X className="size-3 text-accent-warm" />}
                    {formatStage === 'idle' && (
                      <div className="size-3 border border-border bg-card" />
                    )}
                    <span
                      className={`font-mono text-[11px] uppercase tracking-wider ${
                        formatStage === 'complete'
                          ? 'text-accent-success'
                          : formatStage === 'error'
                            ? 'text-accent-warm'
                            : formatStage === 'pending'
                              ? 'text-primary'
                              : 'text-muted-foreground'
                      }`}
                    >
                      Checking format
                    </span>
                  </div>

                  {/* Provider stage */}
                  <div className="flex items-center gap-2">
                    {providerStage === 'pending' && (
                      <Loader2 className="size-3 animate-spin text-primary" />
                    )}
                    {providerStage === 'complete' && (
                      <Check className="size-3 text-accent-success" />
                    )}
                    {providerStage === 'error' && <X className="size-3 text-accent-warm" />}
                    {providerStage === 'idle' && (
                      <div className="size-3 border border-border bg-card" />
                    )}
                    <span
                      className={`font-mono text-[11px] uppercase tracking-wider ${
                        providerStage === 'complete'
                          ? 'text-accent-success'
                          : providerStage === 'error'
                            ? 'text-accent-warm'
                            : providerStage === 'pending'
                              ? 'text-primary'
                              : 'text-muted-foreground'
                      }`}
                    >
                      Validating with {PROVIDER_DISPLAY_NAMES[provider]}
                    </span>
                  </div>

                  {/* Active badge */}
                  <div className="flex items-center gap-2">
                    {providerStage === 'complete' && (
                      <>
                        <Check className="size-3 text-accent-success" />
                        <span className="font-mono text-[11px] uppercase tracking-wider text-accent-success">
                          Active
                        </span>
                      </>
                    )}
                    {providerStage !== 'complete' && (
                      <>
                        <div className="size-3 border border-border bg-card" />
                        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                          Active
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Inline error */}
              {displayError && (
                <p id={errorId} className="text-xs text-accent-warm" role="alert">
                  {displayError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handlePrevStep} size="sm" disabled={isSubmitting}>
                Back
              </Button>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
