import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DrillController } from './drill-controller';

function defaultProps() {
  return {
    drill: {
      targetSkill: 'Chord Transition Drill',
      weaknessDescription: 'C → Am smooth voice leading',
      reps: 5,
      instructions: 'Practice smooth transitions between C and Am',
    },
    currentPhase: 'Setup' as const,
    currentRep: 1,
    repHistory: [] as Array<{ timingDeviationMs: number; accuracy: number }>,
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
