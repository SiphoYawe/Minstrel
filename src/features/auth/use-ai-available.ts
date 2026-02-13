import { useAppStore } from '@/stores/app-store';

export function useAiAvailable(): { isAiAvailable: boolean; provider: string | null } {
  const hasApiKey = useAppStore((s) => s.hasApiKey);

  // Provider tracking will be added to appStore in Epic 4 when AI routes are built.
  // For now, return null — consumers should check isAiAvailable, not provider.
  return {
    isAiAvailable: hasApiKey,
    provider: null,
  };
}
