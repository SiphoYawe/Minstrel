import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils/render';
import { ReplayStudio } from './replay-studio';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';
import { createMockSession } from '@/test-utils/session-fixtures';

// Mock the hook to avoid Dexie side effects
vi.mock('@/features/session/use-replay-session', () => ({
  useReplaySession: vi.fn(),
}));

// Mock replay engine to avoid rAF side effects
vi.mock('@/features/session/replay-engine', () => ({
  togglePlayback: vi.fn(() => {
    const state = useSessionStore.getState();
    useSessionStore
      .getState()
      .setReplayState(state.replayState === 'playing' ? 'paused' : 'playing');
  }),
  setPlaybackSpeed: vi.fn((speed: number) => {
    useSessionStore.getState().setReplaySpeed(speed);
  }),
  seekTo: vi.fn(),
}));

// Mock replay chat hook
const mockSendMessage = vi.fn();
vi.mock('@/features/coaching/use-replay-chat', () => ({
  useReplayChat: vi.fn(() => ({
    messages: [],
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
    error: null,
    setInput: vi.fn(),
    hasApiKey: useAppStore.getState().hasApiKey,
    currentTimestamp: useSessionStore.getState().replayPosition,
    setMessages: vi.fn(),
    sendMessage: mockSendMessage,
  })),
}));

describe('ReplayStudio', () => {
  beforeEach(() => {
    useSessionStore.setState({
      currentMode: 'replay-studio',
      replaySession: null,
      replayEvents: [],
      replayStatus: 'idle',
      replayPosition: 0,
      replayState: 'paused',
      replaySpeed: 1,
    });
    useAppStore.setState({ hasApiKey: true });
  });

  describe('loading state', () => {
    it('shows loading indicator when status is loading', () => {
      useSessionStore.setState({ replayStatus: 'loading' });
      render(<ReplayStudio sessionId={1} />);
      expect(screen.getByText(/loading session/i)).toBeInTheDocument();
    });

    it('shows a progress bar during loading', () => {
      useSessionStore.setState({ replayStatus: 'loading' });
      render(<ReplayStudio sessionId={1} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when session not found', () => {
      useSessionStore.setState({ replayStatus: 'error' });
      render(<ReplayStudio sessionId={999} />);
      expect(screen.getByText(/no sessions to replay/i)).toBeInTheDocument();
    });

    it('shows helpful context about why session is missing', () => {
      useSessionStore.setState({ replayStatus: 'error' });
      render(<ReplayStudio sessionId={999} />);
      expect(screen.getByText(/play a session first/i)).toBeInTheDocument();
    });
  });

  describe('success state - layout', () => {
    beforeEach(() => {
      useSessionStore.setState({
        replayStatus: 'success',
        replaySession: createMockSession({ id: 1, key: 'C major', tempo: 120, duration: 300 }),
        replayEvents: [
          {
            id: 1,
            sessionId: 1,
            type: 'note-on',
            note: 60,
            noteName: 'C',
            velocity: 80,
            channel: 1,
            timestamp: 1000,
            source: 'midi' as const,
            userId: null,
            syncStatus: 'pending' as const,
          },
        ],
      });
    });

    it('renders the visualization canvas', () => {
      render(<ReplayStudio sessionId={1} />);
      expect(screen.getByRole('img', { name: 'MIDI note visualization' })).toBeInTheDocument();
    });

    it('renders the mode switcher', () => {
      render(<ReplayStudio sessionId={1} />);
      expect(screen.getByRole('tablist', { name: 'Session mode' })).toBeInTheDocument();
    });

    it('renders the playback timeline region', () => {
      render(<ReplayStudio sessionId={1} />);
      expect(screen.getByRole('region', { name: 'Playback timeline' })).toBeInTheDocument();
    });

    it('uses CSS grid with 2fr 1fr split', () => {
      const { container } = render(<ReplayStudio sessionId={1} />);
      const grid = container.querySelector('.lg\\:grid-cols-\\[2fr_1fr\\]');
      expect(grid).not.toBeNull();
    });
  });

  describe('tabs', () => {
    beforeEach(() => {
      useSessionStore.setState({
        replayStatus: 'success',
        replaySession: createMockSession({ id: 1, key: 'G major', tempo: 100, duration: 180 }),
        replayEvents: [],
      });
    });

    it('renders tablist with Insights, Sessions, and Chat tabs', () => {
      render(<ReplayStudio sessionId={1} />);
      const tablist = screen.getByRole('tablist', { name: 'Replay details' });
      expect(tablist).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /insights/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /sessions/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /chat/i })).toBeInTheDocument();
    });

    it('Insights tab is active by default', () => {
      render(<ReplayStudio sessionId={1} />);
      const insightsTab = screen.getByRole('tab', { name: /insights/i });
      expect(insightsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('switches to Sessions tab on click', () => {
      render(<ReplayStudio sessionId={1} />);
      fireEvent.click(screen.getByRole('tab', { name: /sessions/i }));
      expect(screen.getByRole('tab', { name: /sessions/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      // Sessions panel renders the SessionsListPanel which loads asynchronously
      expect(
        screen.getByRole('tabpanel', { name: /sessions/i }) ||
          screen.getByText(/loading sessions|no sessions/i)
      ).toBeTruthy();
    });

    it('tab panels have correct aria linkage', () => {
      render(<ReplayStudio sessionId={1} />);
      const insightsTab = screen.getByRole('tab', { name: /insights/i });
      expect(insightsTab).toHaveAttribute('aria-controls', 'panel-insights');
      expect(insightsTab).toHaveAttribute('id', 'tab-insights');
    });
  });

  describe('insights panel', () => {
    beforeEach(() => {
      useSessionStore.setState({
        replayStatus: 'success',
        replaySession: createMockSession({
          id: 1,
          key: 'A minor',
          tempo: 95,
          duration: 240,
          sessionType: 'freeform',
        }),
        replayEvents: [
          {
            id: 1,
            sessionId: 1,
            type: 'note-on',
            note: 60,
            noteName: 'C',
            velocity: 80,
            channel: 1,
            timestamp: 1000,
            source: 'midi' as const,
            userId: null,
            syncStatus: 'pending' as const,
          },
          {
            id: 2,
            sessionId: 1,
            type: 'note-off',
            note: 60,
            noteName: 'C',
            velocity: 0,
            channel: 1,
            timestamp: 1500,
            source: 'midi' as const,
            userId: null,
            syncStatus: 'pending' as const,
          },
        ],
      });
    });

    it('displays session key', () => {
      render(<ReplayStudio sessionId={1} />);
      expect(screen.getByText('A minor')).toBeInTheDocument();
    });

    it('displays session tempo with BPM unit', () => {
      render(<ReplayStudio sessionId={1} />);
      expect(screen.getByText('95')).toBeInTheDocument();
      expect(screen.getByText('BPM')).toBeInTheDocument();
    });

    it('displays session duration formatted as mm:ss', () => {
      render(<ReplayStudio sessionId={1} />);
      const insightsRegion = screen.getByRole('region', { name: 'Session insights' });
      const durationCard = Array.from(
        insightsRegion.querySelectorAll('[class*="bg-surface-light"]')
      ).find((el) => el.textContent?.includes('Duration'));
      expect(durationCard?.textContent).toContain('04:00');
    });

    it('displays note count from events', () => {
      render(<ReplayStudio sessionId={1} />);
      const insightsRegion = screen.getByRole('region', { name: 'Session insights' });
      const notesCard = Array.from(
        insightsRegion.querySelectorAll('[class*="bg-surface-light"]')
      ).find((el) => el.textContent?.includes('Notes'));
      expect(notesCard?.textContent).toContain('1');
    });

    it('displays session type', () => {
      render(<ReplayStudio sessionId={1} />);
      expect(screen.getByText('freeform')).toBeInTheDocument();
    });
  });

  describe('timeline bar', () => {
    beforeEach(() => {
      useSessionStore.setState({
        replayStatus: 'success',
        replaySession: createMockSession({ id: 1, duration: 300 }),
        replayEvents: [],
        replayPosition: 60000, // 1 minute
        replayState: 'paused',
        replaySpeed: 1,
      });
    });

    it('displays current position and total time', () => {
      render(<ReplayStudio sessionId={1} />);
      // Time display is within a single span with child elements for the divider
      const timeDisplay = screen.getByText((_content, element) => {
        return element?.textContent === '01:00/05:00' || false;
      });
      expect(timeDisplay).toBeInTheDocument();
    });

    it('renders play button when paused', () => {
      render(<ReplayStudio sessionId={1} />);
      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    });

    it('toggles to pause on play click', () => {
      render(<ReplayStudio sessionId={1} />);
      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
      expect(useSessionStore.getState().replayState).toBe('playing');
    });

    it('renders speed control buttons', () => {
      render(<ReplayStudio sessionId={1} />);
      expect(screen.getByRole('button', { name: /0\.5x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /1x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /2x/i })).toBeInTheDocument();
    });

    it('changes speed when speed button is clicked', () => {
      render(<ReplayStudio sessionId={1} />);
      fireEvent.click(screen.getByRole('button', { name: /2x/i }));
      expect(useSessionStore.getState().replaySpeed).toBe(2);
    });

    it('has active state on current speed button', () => {
      render(<ReplayStudio sessionId={1} />);
      const btn1x = screen.getByRole('button', { name: /set speed to 1x/i });
      expect(btn1x).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders a session timeline slider', () => {
      render(<ReplayStudio sessionId={1} />);
      expect(screen.getByRole('slider', { name: /session timeline/i })).toBeInTheDocument();
    });

    it('slider responds to keyboard navigation', () => {
      render(<ReplayStudio sessionId={1} />);
      const slider = screen.getByRole('slider', { name: /session timeline/i });
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      expect(useSessionStore.getState().replayPosition).toBe(61_000); // 60000 + 1000
    });
  });

  describe('roving tabindex keyboard navigation (UI-H3)', () => {
    beforeEach(() => {
      useSessionStore.setState({
        replayStatus: 'success',
        replaySession: createMockSession({ id: 1, key: 'C major', tempo: 120, duration: 300 }),
        replayEvents: [],
      });
    });

    it('ArrowRight moves focus from Insights to Sessions tab', () => {
      render(<ReplayStudio sessionId={1} />);
      const insightsTab = screen.getByRole('tab', { name: /insights/i });
      insightsTab.focus();
      fireEvent.keyDown(insightsTab, { key: 'ArrowRight' });
      const sessionsTab = screen.getByRole('tab', { name: /sessions/i });
      expect(sessionsTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(sessionsTab);
    });

    it('ArrowRight wraps from Chat to Insights tab', () => {
      render(<ReplayStudio sessionId={1} />);
      // First move to Chat tab
      fireEvent.click(screen.getByRole('tab', { name: /chat/i }));
      const chatTab = screen.getByRole('tab', { name: /chat/i });
      chatTab.focus();
      fireEvent.keyDown(chatTab, { key: 'ArrowRight' });
      const insightsTab = screen.getByRole('tab', { name: /insights/i });
      expect(insightsTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(insightsTab);
    });

    it('ArrowLeft moves focus from Insights to Chat tab (wraps)', () => {
      render(<ReplayStudio sessionId={1} />);
      const insightsTab = screen.getByRole('tab', { name: /insights/i });
      insightsTab.focus();
      fireEvent.keyDown(insightsTab, { key: 'ArrowLeft' });
      const chatTab = screen.getByRole('tab', { name: /chat/i });
      expect(chatTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(chatTab);
    });

    it('Home key moves focus to first tab', () => {
      render(<ReplayStudio sessionId={1} />);
      fireEvent.click(screen.getByRole('tab', { name: /chat/i }));
      const chatTab = screen.getByRole('tab', { name: /chat/i });
      chatTab.focus();
      fireEvent.keyDown(chatTab, { key: 'Home' });
      const insightsTab = screen.getByRole('tab', { name: /insights/i });
      expect(insightsTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(insightsTab);
    });

    it('End key moves focus to last tab', () => {
      render(<ReplayStudio sessionId={1} />);
      const insightsTab = screen.getByRole('tab', { name: /insights/i });
      insightsTab.focus();
      fireEvent.keyDown(insightsTab, { key: 'End' });
      const chatTab = screen.getByRole('tab', { name: /chat/i });
      expect(chatTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(chatTab);
    });

    it('inactive tabs have tabIndex -1', () => {
      render(<ReplayStudio sessionId={1} />);
      const sessionsTab = screen.getByRole('tab', { name: /sessions/i });
      const chatTab = screen.getByRole('tab', { name: /chat/i });
      expect(sessionsTab).toHaveAttribute('tabindex', '-1');
      expect(chatTab).toHaveAttribute('tabindex', '-1');
    });

    it('active tab has tabIndex 0', () => {
      render(<ReplayStudio sessionId={1} />);
      const insightsTab = screen.getByRole('tab', { name: /insights/i });
      expect(insightsTab).toHaveAttribute('tabindex', '0');
    });
  });

  describe('loading state announcement (UI-H4)', () => {
    it('has an aria-live="assertive" region with loading text', () => {
      useSessionStore.setState({ replayStatus: 'loading' });
      render(<ReplayStudio sessionId={1} />);
      const liveRegion = screen.getByText('Loading replay data');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });

    it('loading announcement is screen-reader only', () => {
      useSessionStore.setState({ replayStatus: 'loading' });
      render(<ReplayStudio sessionId={1} />);
      const liveRegion = screen.getByText('Loading replay data');
      expect(liveRegion).toHaveClass('sr-only');
    });
  });

  describe('chat tab', () => {
    beforeEach(() => {
      useSessionStore.setState({
        replayStatus: 'success',
        replaySession: createMockSession({ id: 1, key: 'C major', tempo: 120, duration: 300 }),
        replayEvents: [],
        replayPosition: 90_000,
      });
      useAppStore.setState({ hasApiKey: true });
    });

    it('switches to Chat tab on click', () => {
      render(<ReplayStudio sessionId={1} />);
      fireEvent.click(screen.getByRole('tab', { name: /chat/i }));
      expect(screen.getByRole('tab', { name: /chat/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('renders the replay chat region when Chat tab is active', () => {
      render(<ReplayStudio sessionId={1} />);
      fireEvent.click(screen.getByRole('tab', { name: /chat/i }));
      expect(screen.getByRole('region', { name: 'Replay chat' })).toBeInTheDocument();
    });

    it('chat tab panel has correct aria linkage', () => {
      render(<ReplayStudio sessionId={1} />);
      const chatTab = screen.getByRole('tab', { name: /chat/i });
      expect(chatTab).toHaveAttribute('aria-controls', 'panel-chat');
      expect(chatTab).toHaveAttribute('id', 'tab-chat');
    });

    it('shows graceful degradation when no API key', () => {
      useAppStore.setState({ hasApiKey: false });
      render(<ReplayStudio sessionId={1} />);
      fireEvent.click(screen.getByRole('tab', { name: /chat/i }));
      expect(screen.getByText(/connect your api key in settings/i)).toBeInTheDocument();
    });

    it('shows Settings link in degradation state', () => {
      useAppStore.setState({ hasApiKey: false });
      render(<ReplayStudio sessionId={1} />);
      fireEvent.click(screen.getByRole('tab', { name: /chat/i }));
      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink).toBeInTheDocument();
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('shows empty state message when no messages', () => {
      render(<ReplayStudio sessionId={1} />);
      fireEvent.click(screen.getByRole('tab', { name: /chat/i }));
      expect(screen.getByText(/ask about what happened/i)).toBeInTheDocument();
    });

    it('shows timestamp context indicator', () => {
      render(<ReplayStudio sessionId={1} />);
      fireEvent.click(screen.getByRole('tab', { name: /chat/i }));
      expect(screen.getByText(/asking about moment at/i)).toBeInTheDocument();
    });

    it('renders chat input with correct label', () => {
      render(<ReplayStudio sessionId={1} />);
      fireEvent.click(screen.getByRole('tab', { name: /chat/i }));
      expect(screen.getByRole('textbox', { name: /ask about this moment/i })).toBeInTheDocument();
    });

    it('renders send button', () => {
      render(<ReplayStudio sessionId={1} />);
      fireEvent.click(screen.getByRole('tab', { name: /chat/i }));
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });
  });
});
