export type SessionMode = 'silent-coach' | 'dashboard-chat' | 'replay-studio';

export interface ModeConfig {
  name: string;
  label: string;
  shortcut: string;
  canvasPercentage: number;
  showChat: boolean;
  showDataCards: boolean;
}

export const MODE_CONFIGS: Record<SessionMode, ModeConfig> = {
  'silent-coach': {
    name: 'Silent Coach',
    label: 'Silent Coach',
    shortcut: '1',
    canvasPercentage: 90,
    showChat: false,
    showDataCards: false,
  },
  'dashboard-chat': {
    name: 'Dashboard + Chat',
    label: 'Dashboard',
    shortcut: '2',
    canvasPercentage: 60,
    showChat: true,
    showDataCards: true,
  },
  'replay-studio': {
    name: 'Replay Studio',
    label: 'Replay',
    shortcut: '3',
    canvasPercentage: 70,
    showChat: false,
    showDataCards: true,
  },
};
