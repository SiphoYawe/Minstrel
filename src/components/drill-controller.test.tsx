import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DrillController } from './drill-controller';

const DEFAULT_SUCCESS_CRITERIA = {
  accuracyTarget: 0.85,
  timingThresholdMs: 50,
  tempoToleranceBpm: 10,
};

function defaultProps() {
  return {
    drill: {
      targetSkill: 'Chord Transition Drill',
      weaknessDescription: 'C → Am smooth voice leading',
      reps: 5,
      instructions: 'Practice smooth transitions between C and Am',
      successCriteria: DEFAULT_SUCCESS_CRITERIA,
      targetTempo: 90,
    },
    currentPhase: 'Setup' as const,
    currentRep: 1,
    repHistory: [] as Array<{
      timingDeviationMs: number;
      accuracy: number;
      tempoAchievedBpm?: number | null;
    }>,
    improvementMessage: '',
    onOneMore: vi.fn(),
    onComplete: vi.fn(),
    onStartDrill: vi.fn(),
  };
}

describe('DrillController', () => {
  describe('Setup phase', () => {
    it('renders drill title and description', () => {
      render(<DrillController {...defaultProps()} />);
      expect(screen.getByText('Chord Transition Drill')).toBeInTheDocument();
      expect(screen.getByText('C → Am smooth voice leading')).toBeInTheDocument();
    });

    it('shows instructions and "Listen first" prompt', () => {
      render(<DrillController {...defaultProps()} />);
      expect(screen.getByText('Practice smooth transitions between C and Am')).toBeInTheDocument();
      expect(screen.getByText('Listen first')).toBeInTheDocument();
    });

    it('shows Start Drill button', () => {
      render(<DrillController {...defaultProps()} />);
      expect(screen.getByRole('button', { name: 'Start Drill' })).toBeInTheDocument();
    });

    it('calls onStartDrill when Start button clicked', async () => {
      const user = userEvent.setup();
      const props = defaultProps();
      render(<DrillController {...props} />);
      await user.click(screen.getByRole('button', { name: 'Start Drill' }));
      expect(props.onStartDrill).toHaveBeenCalledTimes(1);
    });
  });

  describe('Demonstrate phase', () => {
    it('shows "Demonstrating…" indicator', () => {
      render(<DrillController {...defaultProps()} currentPhase="Demonstrate" />);
      // Visible indicator (not sr-only)
      const indicators = screen.getAllByText(/Demonstrating/);
      const visible = indicators.find((el) => !el.closest('.sr-only'));
      expect(visible).toBeInTheDocument();
    });

    it('does not show action buttons', () => {
      render(<DrillController {...defaultProps()} currentPhase="Demonstrate" />);
      expect(screen.queryByRole('button', { name: 'One more' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Complete' })).not.toBeInTheDocument();
    });
  });

  describe('Listen phase', () => {
    it('shows "Your turn" label', () => {
      render(<DrillController {...defaultProps()} currentPhase="Listen" />);
      expect(screen.getByText('Your turn')).toBeInTheDocument();
    });

    it('shows prepare prompt', () => {
      render(<DrillController {...defaultProps()} currentPhase="Listen" />);
      expect(screen.getByText('Prepare to play the exercise')).toBeInTheDocument();
    });
  });

  describe('Attempt phase', () => {
    it('shows rep counter', () => {
      render(<DrillController {...defaultProps()} currentPhase="Attempt" currentRep={3} />);
      expect(screen.getByText('Rep 3/5')).toBeInTheDocument();
    });

    it('shows listening indicator', () => {
      render(<DrillController {...defaultProps()} currentPhase="Attempt" />);
      expect(screen.getByText(/Listening/)).toBeInTheDocument();
    });
  });

  describe('Analyze phase', () => {
    it('shows timing delta display', () => {
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Analyze"
          currentRep={2}
          repHistory={[
            { timingDeviationMs: 380, accuracy: 0.65 },
            { timingDeviationMs: 220, accuracy: 0.78 },
          ]}
        />
      );
      expect(screen.getByText('380ms › 220ms')).toBeInTheDocument();
    });

    it('shows accuracy display', () => {
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Analyze"
          currentRep={2}
          repHistory={[
            { timingDeviationMs: 50, accuracy: 0.65 },
            { timingDeviationMs: 40, accuracy: 0.78 },
          ]}
        />
      );
      expect(screen.getByText('65% › 78%')).toBeInTheDocument();
    });

    it('shows improvement percentage', () => {
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Analyze"
          currentRep={2}
          repHistory={[
            { timingDeviationMs: 50, accuracy: 0.5 },
            { timingDeviationMs: 30, accuracy: 0.85 },
          ]}
        />
      );
      expect(screen.getByText(/70%/)).toBeInTheDocument();
    });

    it('shows "One more" and "Complete" buttons', () => {
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Analyze"
          currentRep={1}
          repHistory={[{ timingDeviationMs: 50, accuracy: 0.8 }]}
        />
      );
      expect(screen.getByRole('button', { name: 'One more' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Complete' })).toBeInTheDocument();
    });

    it('calls onOneMore when One more button clicked', async () => {
      const user = userEvent.setup();
      const props = defaultProps();
      render(
        <DrillController
          {...props}
          currentPhase="Analyze"
          repHistory={[{ timingDeviationMs: 50, accuracy: 0.8 }]}
        />
      );
      await user.click(screen.getByRole('button', { name: 'One more' }));
      expect(props.onOneMore).toHaveBeenCalledTimes(1);
    });

    it('calls onComplete when Complete button clicked', async () => {
      const user = userEvent.setup();
      const props = defaultProps();
      render(
        <DrillController
          {...props}
          currentPhase="Analyze"
          repHistory={[{ timingDeviationMs: 50, accuracy: 0.8 }]}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Complete' }));
      expect(props.onComplete).toHaveBeenCalledTimes(1);
    });

    it('shows improvement message with growth mindset framing', () => {
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Analyze"
          currentRep={2}
          repHistory={[
            { timingDeviationMs: 50, accuracy: 0.6 },
            { timingDeviationMs: 30, accuracy: 0.8 },
          ]}
          improvementMessage="Closing in"
        />
      );
      expect(screen.getByText('Closing in')).toBeInTheDocument();
    });
  });

  describe('Complete phase', () => {
    it('shows completion summary with rep count', () => {
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Complete"
          currentRep={3}
          repHistory={[
            { timingDeviationMs: 50, accuracy: 0.6 },
            { timingDeviationMs: 40, accuracy: 0.75 },
            { timingDeviationMs: 30, accuracy: 0.88 },
          ]}
        />
      );
      expect(screen.getByText('3 reps completed')).toBeInTheDocument();
    });

    it('shows improvement summary when positive', () => {
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Complete"
          currentRep={2}
          repHistory={[
            { timingDeviationMs: 50, accuracy: 0.5 },
            { timingDeviationMs: 30, accuracy: 0.85 },
          ]}
        />
      );
      expect(screen.getByText(/Solid progress/)).toBeInTheDocument();
    });
  });

  describe('Phase indicator', () => {
    it('renders visible phase labels', () => {
      render(<DrillController {...defaultProps()} currentPhase="Demonstrate" />);
      expect(screen.getByText('Demonstrate')).toBeInTheDocument();
      expect(screen.getByText('Your Turn')).toBeInTheDocument();
      expect(screen.getByText('Playing')).toBeInTheDocument();
      expect(screen.getByText('Results')).toBeInTheDocument();
    });

    it('marks current phase with aria-current="step"', () => {
      render(<DrillController {...defaultProps()} currentPhase="Listen" />);
      const listenPhase = screen.getByText('Your Turn').closest('[aria-current]');
      expect(listenPhase).toHaveAttribute('aria-current', 'step');
    });
  });

  describe('Accessibility', () => {
    it('has aria-live region for phase announcements', () => {
      const { container } = render(<DrillController {...defaultProps()} />);
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('has navigation landmark for phase indicator', () => {
      render(<DrillController {...defaultProps()} />);
      expect(screen.getByRole('navigation', { name: 'Drill phases' })).toBeInTheDocument();
    });
  });

  describe('Complete phase actions', () => {
    const completeProps = () => ({
      ...defaultProps(),
      currentPhase: 'Complete' as const,
      currentRep: 3,
      repHistory: [
        { timingDeviationMs: 50, accuracy: 0.6 },
        { timingDeviationMs: 40, accuracy: 0.75 },
        { timingDeviationMs: 30, accuracy: 0.88 },
      ],
      onNewDrill: vi.fn(),
      onDone: vi.fn(),
    });

    it('shows Try Again, New Drill, and Done buttons in Complete phase', () => {
      render(<DrillController {...completeProps()} />);
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'New Drill' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });

    it('calls onNewDrill when New Drill clicked', async () => {
      const user = userEvent.setup();
      const props = completeProps();
      render(<DrillController {...props} />);
      await user.click(screen.getByRole('button', { name: 'New Drill' }));
      expect(props.onNewDrill).toHaveBeenCalledTimes(1);
    });

    it('calls onDone when Done clicked', async () => {
      const user = userEvent.setup();
      const props = completeProps();
      render(<DrillController {...props} />);
      await user.click(screen.getByRole('button', { name: 'Done' }));
      expect(props.onDone).toHaveBeenCalledTimes(1);
    });

    it('does not show New Drill/Done when callbacks not provided', () => {
      const props = {
        ...defaultProps(),
        currentPhase: 'Complete' as const,
        repHistory: [{ timingDeviationMs: 50, accuracy: 0.8 }],
      };
      render(<DrillController {...props} />);
      expect(screen.queryByRole('button', { name: 'New Drill' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
      // Try Again should still be present
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    });
  });

  describe('Keyboard hints', () => {
    it('shows Enter keyboard hint next to Start Drill button in Setup phase', () => {
      render(<DrillController {...defaultProps()} />);
      const kbdElements = screen.getAllByText('Enter');
      const kbdElement = kbdElements.find((el) => el.tagName === 'KBD');
      expect(kbdElement).toBeInTheDocument();
    });

    it('does not show Enter keyboard hint in non-Setup phases', () => {
      render(<DrillController {...defaultProps()} currentPhase="Demonstrate" />);
      const kbdElements = screen.queryAllByText('Enter');
      const kbdElement = kbdElements.find((el) => el.tagName === 'KBD');
      expect(kbdElement).toBeUndefined();
    });
  });

  describe('Instructions visibility and real-time feedback', () => {
    it('shows collapsible instructions toggle during Attempt phase', () => {
      render(<DrillController {...defaultProps()} currentPhase="Attempt" />);
      const toggle = screen.getByRole('button', { name: /Instructions/i });
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('expands instructions when toggle clicked', async () => {
      const user = userEvent.setup();
      render(<DrillController {...defaultProps()} currentPhase="Attempt" />);
      await user.click(screen.getByRole('button', { name: /Instructions/i }));
      expect(screen.getByText('Practice smooth transitions between C and Am')).toBeInTheDocument();
    });

    it('does not show instructions toggle in non-Attempt phases', () => {
      render(<DrillController {...defaultProps()} currentPhase="Setup" />);
      // The instructions toggle only appears in Attempt phase
      const toggle = screen.queryByRole('button', { name: /^Instructions$/i });
      // In Setup the instructions text is shown directly, not via toggle
      expect(toggle).not.toBeInTheDocument();
    });

    it('shows green flash for on-target note feedback', () => {
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Attempt"
          latestNoteFeedback="on-target"
        />
      );
      expect(screen.getByLabelText('On target')).toBeInTheDocument();
    });

    it('shows amber flash for close note feedback', () => {
      render(
        <DrillController {...defaultProps()} currentPhase="Attempt" latestNoteFeedback="close" />
      );
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('does not show flash for off-target', () => {
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Attempt"
          latestNoteFeedback="off-target"
        />
      );
      expect(screen.queryByLabelText('On target')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
    });

    it('shows Early timing indicator', () => {
      render(
        <DrillController {...defaultProps()} currentPhase="Attempt" latestTimingDeviation="early" />
      );
      expect(screen.getByText('Early')).toBeInTheDocument();
    });

    it('shows Late timing indicator', () => {
      render(
        <DrillController {...defaultProps()} currentPhase="Attempt" latestTimingDeviation="late" />
      );
      expect(screen.getByText('Late')).toBeInTheDocument();
    });
  });

  describe('Countdown timer and Done button', () => {
    it('shows countdown timer during Attempt phase', () => {
      render(
        <DrillController {...defaultProps()} currentPhase="Attempt" attemptDurationSec={15} />
      );
      expect(screen.getByRole('timer')).toBeInTheDocument();
      expect(screen.getByText('15s')).toBeInTheDocument();
    });

    it('shows Done button during Attempt phase when onEndAttempt provided', () => {
      render(<DrillController {...defaultProps()} currentPhase="Attempt" onEndAttempt={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });

    it('calls onEndAttempt when Done button clicked', async () => {
      const user = userEvent.setup();
      const onEndAttempt = vi.fn();
      render(
        <DrillController {...defaultProps()} currentPhase="Attempt" onEndAttempt={onEndAttempt} />
      );
      await user.click(screen.getByRole('button', { name: 'Done' }));
      expect(onEndAttempt).toHaveBeenCalledTimes(1);
    });

    it('calls onEndAttempt when Enter key pressed during Attempt phase', async () => {
      const user = userEvent.setup();
      const onEndAttempt = vi.fn();
      render(
        <DrillController {...defaultProps()} currentPhase="Attempt" onEndAttempt={onEndAttempt} />
      );
      await user.keyboard('{Enter}');
      expect(onEndAttempt).toHaveBeenCalledTimes(1);
    });

    it('shows no-notes prompt when notesCaptured is 0 after timeout', async () => {
      vi.useFakeTimers();
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Attempt"
          notesCaptured={0}
          attemptDurationSec={30}
        />
      );
      // Advance past the no-notes timeout
      await act(async () => {
        vi.advanceTimersByTime(16000);
      });
      expect(screen.getByText('No notes detected. Try again?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
      vi.useRealTimers();
    });

    it('does not show no-notes prompt when notes have been captured', async () => {
      vi.useFakeTimers();
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Attempt"
          notesCaptured={5}
          attemptDurationSec={30}
        />
      );
      await act(async () => {
        vi.advanceTimersByTime(16000);
      });
      expect(screen.queryByText('No notes detected. Try again?')).not.toBeInTheDocument();
      vi.useRealTimers();
    });

    it('shows Enter keyboard hint next to Done button', () => {
      render(<DrillController {...defaultProps()} currentPhase="Attempt" onEndAttempt={vi.fn()} />);
      const kbdElements = screen.getAllByText('Enter');
      const kbdElement = kbdElements.find((el) => el.tagName === 'KBD');
      expect(kbdElement).toBeInTheDocument();
    });
  });

  describe('Success criteria', () => {
    it('shows success criteria targets during Attempt phase', () => {
      render(<DrillController {...defaultProps()} currentPhase="Attempt" />);
      expect(screen.getByText(/Accuracy: 85%/)).toBeInTheDocument();
      expect(screen.getByText(/Timing: ±50ms/)).toBeInTheDocument();
      expect(screen.getByText(/Tempo: 90 BPM/)).toBeInTheDocument();
    });

    it('does not show actual values during Attempt phase', () => {
      render(<DrillController {...defaultProps()} currentPhase="Attempt" />);
      // No parenthesized actual values should appear
      const container = screen.getByLabelText('Success criteria');
      expect(container.textContent).not.toMatch(/\(\d+%\)/);
    });

    it('shows met/not-yet-met comparison in Analyze phase', () => {
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Analyze"
          repHistory={[{ timingDeviationMs: 30, accuracy: 0.9, tempoAchievedBpm: 88 }]}
        />
      );
      // Accuracy met (90% >= 85%)
      expect(screen.getByLabelText('Accuracy met')).toBeInTheDocument();
      // Timing met (30ms <= 50ms)
      expect(screen.getByLabelText('Timing met')).toBeInTheDocument();
      // Tempo met (|88-90| = 2 <= 10)
      expect(screen.getByLabelText('Tempo met')).toBeInTheDocument();
    });

    it('shows not-yet-met indicators when criteria missed', () => {
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Analyze"
          repHistory={[{ timingDeviationMs: 80, accuracy: 0.6, tempoAchievedBpm: 70 }]}
        />
      );
      expect(screen.getByLabelText('Accuracy not yet met')).toBeInTheDocument();
      expect(screen.getByLabelText('Timing not yet met')).toBeInTheDocument();
      expect(screen.getByLabelText('Tempo not yet met')).toBeInTheDocument();
    });

    it('shows actual values next to targets in Analyze phase', () => {
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Analyze"
          repHistory={[{ timingDeviationMs: 30, accuracy: 0.9, tempoAchievedBpm: 88 }]}
        />
      );
      expect(screen.getByText('(90%)')).toBeInTheDocument();
      expect(screen.getByText('(±30ms)')).toBeInTheDocument();
      expect(screen.getByText('(88 BPM)')).toBeInTheDocument();
    });

    it('does not show criteria in Setup phase', () => {
      render(<DrillController {...defaultProps()} currentPhase="Setup" />);
      expect(screen.queryByLabelText('Success criteria')).not.toBeInTheDocument();
    });

    it('does not show criteria when successCriteria is undefined', () => {
      const props = defaultProps();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { successCriteria, targetTempo, ...drillWithout } = props.drill;
      render(<DrillController {...props} drill={drillWithout} currentPhase="Attempt" />);
      expect(screen.queryByLabelText('Success criteria')).not.toBeInTheDocument();
    });

    it('provides tooltip explanations for each metric', async () => {
      const user = userEvent.setup();
      render(<DrillController {...defaultProps()} currentPhase="Attempt" />);
      // Tooltip trigger buttons have aria-label matching the tooltip text
      const tooltipButtons = screen.getAllByRole('button', {
        name: /percentage|close your note|speed you need/i,
      });
      expect(tooltipButtons.length).toBeGreaterThanOrEqual(3);
      await user.hover(tooltipButtons[0]);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('Pause and resume', () => {
    it('shows Pause button during Attempt phase when onPause provided', () => {
      render(<DrillController {...defaultProps()} currentPhase="Attempt" onPause={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    });

    it('shows paused overlay when isPaused is true', () => {
      render(
        <DrillController {...defaultProps()} currentPhase="Attempt" isPaused onResume={vi.fn()} />
      );
      expect(screen.getByText('Paused')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    });

    it('calls onPause when Pause button clicked', async () => {
      const user = userEvent.setup();
      const onPause = vi.fn();
      render(<DrillController {...defaultProps()} currentPhase="Attempt" onPause={onPause} />);
      await user.click(screen.getByRole('button', { name: 'Pause' }));
      expect(onPause).toHaveBeenCalledTimes(1);
    });

    it('calls onResume when Resume button clicked', async () => {
      const user = userEvent.setup();
      const onResume = vi.fn();
      render(
        <DrillController {...defaultProps()} currentPhase="Attempt" isPaused onResume={onResume} />
      );
      await user.click(screen.getByRole('button', { name: 'Resume' }));
      expect(onResume).toHaveBeenCalledTimes(1);
    });

    it('calls onPause when Escape pressed during attempt', async () => {
      const user = userEvent.setup();
      const onPause = vi.fn();
      render(<DrillController {...defaultProps()} currentPhase="Attempt" onPause={onPause} />);
      await user.keyboard('{Escape}');
      expect(onPause).toHaveBeenCalledTimes(1);
    });

    it('calls onResume when Escape pressed while paused', async () => {
      const user = userEvent.setup();
      const onResume = vi.fn();
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Attempt"
          isPaused
          onPause={vi.fn()}
          onResume={onResume}
        />
      );
      await user.keyboard('{Escape}');
      expect(onResume).toHaveBeenCalledTimes(1);
    });

    it('hides Pause and Done buttons when paused', () => {
      render(
        <DrillController
          {...defaultProps()}
          currentPhase="Attempt"
          isPaused
          onPause={vi.fn()}
          onEndAttempt={vi.fn()}
          onResume={vi.fn()}
        />
      );
      expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
    });

    it('shows paused overlay with Esc hint', () => {
      render(
        <DrillController {...defaultProps()} currentPhase="Attempt" isPaused onResume={vi.fn()} />
      );
      expect(screen.getByLabelText('Drill paused')).toBeInTheDocument();
    });
  });

  describe('Growth mindset', () => {
    it('never renders the word "failed"', () => {
      const { container } = render(
        <DrillController
          {...defaultProps()}
          currentPhase="Analyze"
          repHistory={[{ timingDeviationMs: 200, accuracy: 0.2 }]}
          improvementMessage="Hang in there"
        />
      );
      expect(container.textContent).not.toContain('failed');
      expect(container.textContent).not.toContain('Failed');
    });

    it('never renders the word "wrong"', () => {
      const { container } = render(
        <DrillController
          {...defaultProps()}
          currentPhase="Analyze"
          repHistory={[{ timingDeviationMs: 200, accuracy: 0.2 }]}
        />
      );
      expect(container.textContent).not.toContain('wrong');
      expect(container.textContent).not.toContain('Wrong');
    });
  });
});
