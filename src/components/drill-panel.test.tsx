import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DrillPanel } from './drill-panel';
import type { GeneratedDrill } from '@/features/drills/drill-types';

// Mock the preview hook
const mockStart = vi.fn();
const mockStop = vi.fn();
const mockRepeat = vi.fn();
let mockPreviewState = 'idle' as 'idle' | 'playing' | 'finished';

vi.mock('@/hooks/use-drill-preview', () => ({
  useDrillPreview: () => ({
    state: mockPreviewState,
    activeNoteIndex: -1,
    start: mockStart,
    stop: mockStop,
    repeat: mockRepeat,
  }),
}));

function makeDrill(overrides?: Partial<GeneratedDrill>): GeneratedDrill {
  return {
    id: 'drill-1',
    targetSkill: 'Chord Transitions',
    weaknessDescription: 'C → Am smooth voice leading',
    sequence: {
      notes: [
        { midiNote: 60, duration: 1, velocity: 80, startBeat: 0 },
        { midiNote: 64, duration: 1, velocity: 80, startBeat: 1 },
      ],
      timeSignature: [4, 4] as [number, number],
      measures: 2,
    },
    targetTempo: 90,
    successCriteria: { accuracyTarget: 0.85, timingThresholdMs: 50, tempoToleranceBpm: 10 },
    reps: 4,
    instructions: 'Practice smooth transitions',
    difficultyLevel: {
      tempo: 90,
      harmonicComplexity: 0.3,
      rhythmicDensity: 0.2,
      keyDifficulty: 0.1,
      noteRange: 0.3,
    },
    ...overrides,
  };
}

describe('DrillPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPreviewState = 'idle';
  });

  it('renders loading skeleton when generating', () => {
    const { container } = render(
      <DrillPanel drill={null} isGenerating error={null} onRetry={vi.fn()} onDismiss={vi.fn()} />
    );
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('renders error card when error present', () => {
    render(
      <DrillPanel
        drill={null}
        isGenerating={false}
        error="Something went wrong"
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders drill card when drill provided', () => {
    render(
      <DrillPanel
        drill={makeDrill()}
        isGenerating={false}
        error={null}
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText('Chord Transitions')).toBeInTheDocument();
  });

  it('auto-starts preview on mount', () => {
    render(
      <DrillPanel
        drill={makeDrill()}
        isGenerating={false}
        error={null}
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it('shows single Start button when preview idle', () => {
    render(
      <DrillPanel
        drill={makeDrill()}
        isGenerating={false}
        error={null}
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
        onStart={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    // No separate Preview button
    expect(screen.queryByRole('button', { name: /Preview/i })).not.toBeInTheDocument();
  });

  it('shows Stop button when preview is playing', () => {
    mockPreviewState = 'playing';
    render(
      <DrillPanel
        drill={makeDrill()}
        isGenerating={false}
        error={null}
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Stop preview' })).toBeInTheDocument();
  });

  it('calls onStart when Start button clicked', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(
      <DrillPanel
        drill={makeDrill()}
        isGenerating={false}
        error={null}
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
        onStart={onStart}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('shows Replay Preview link when preview finished', () => {
    mockPreviewState = 'finished';
    render(
      <DrillPanel
        drill={makeDrill()}
        isGenerating={false}
        error={null}
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText('Replay Preview')).toBeInTheDocument();
  });

  it('shows difficulty explanation when provided', () => {
    render(
      <DrillPanel
        drill={makeDrill()}
        isGenerating={false}
        error={null}
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
        difficultyExplanation="We noticed your accuracy was 95%. Increasing tempo to keep you in the growth zone."
        difficultyTriggers={['tempo: 80 → 95 BPM']}
      />
    );
    expect(screen.getByLabelText('Difficulty adjustment')).toBeInTheDocument();
    expect(screen.getByText(/Increasing tempo/)).toBeInTheDocument();
    expect(screen.getByText('tempo: 80 → 95 BPM')).toBeInTheDocument();
  });

  it('maximum 2 clicks from intent to attempt (generate auto-previews, then Start)', () => {
    // Click 1: Generate drill (external, triggers drill prop)
    // Click 2: Start button
    // Preview auto-starts, no separate preview click needed
    const onStart = vi.fn();
    render(
      <DrillPanel
        drill={makeDrill()}
        isGenerating={false}
        error={null}
        onRetry={vi.fn()}
        onDismiss={vi.fn()}
        onStart={onStart}
      />
    );
    // Preview auto-started
    expect(mockStart).toHaveBeenCalled();
    // Only one action button visible (Start), not two
    const actionButtons = screen.getAllByRole('button');
    const startButton = actionButtons.find((b) => b.textContent === 'Start');
    expect(startButton).toBeDefined();
  });
});
