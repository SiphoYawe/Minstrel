'use client';

import { useState, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';
import { buildSessionContext } from '@/features/coaching/context-builder';
import { buildDrillRequest, requestDrill } from '@/features/drills/drill-generator';
import { DEFAULT_DIFFICULTY } from '@/features/difficulty/difficulty-engine';
import type { GeneratedDrill } from '@/features/drills/drill-types';
import type { SupportedProvider } from '@/lib/ai/provider';

export interface DrillGenerationState {
  drill: GeneratedDrill | null;
  isGenerating: boolean;
  error: string | null;
  generate: (weakness?: string) => Promise<void>;
  retry: () => Promise<void>;
  dismiss: () => void;
}

export function useDrillGeneration(): DrillGenerationState {
  const [drill, setDrill] = useState<GeneratedDrill | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastWeakness, setLastWeakness] = useState<string>('');

  const generate = useCallback(async (weakness?: string) => {
    const hasApiKey = useAppStore.getState().hasApiKey;
    if (!hasApiKey) {
      setError('Add an API key in Settings to generate drills.');
      return;
    }

    const provider = useAppStore.getState().apiKeyProvider as SupportedProvider | null;
    if (!provider) {
      setError('No AI provider configured. Add an API key in Settings.');
      return;
    }

    const snapshot = useSessionStore.getState().currentSnapshot;
    const effectiveWeakness =
      weakness ?? snapshot?.keyInsight ?? 'Generate a drill based on my current session';

    setLastWeakness(effectiveWeakness);
    setIsGenerating(true);
    setError(null);
    setDrill(null);

    try {
      const sessionContext = buildSessionContext();
      const request = buildDrillRequest(
        effectiveWeakness,
        null,
        { ...DEFAULT_DIFFICULTY },
        sessionContext.genre,
        []
      );

      const generatedDrill = await requestDrill(request, sessionContext, provider);

      setDrill(generatedDrill);
      useSessionStore.getState().setCurrentDrill(generatedDrill);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message.replace(/^\[.*?\]\s*/, '')
          : 'Could not create a drill right now. Try again in a moment.';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const retry = useCallback(async () => {
    await generate(lastWeakness || undefined);
  }, [generate, lastWeakness]);

  const dismiss = useCallback(() => {
    setDrill(null);
    setError(null);
    setIsGenerating(false);
  }, []);

  return { drill, isGenerating, error, generate, retry, dismiss };
}
