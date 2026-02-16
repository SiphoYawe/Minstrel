import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@/test-utils/render';
import { TimelineScrubber } from './timeline-scrubber';
import type { TimelineScrubberProps, TimelineMarker } from './timeline-scrubber';

// Mock lucide-react icons as simple spans
vi.mock('lucide-react', () => ({
  Play: (props: Record<string, unknown>) => <span data-testid="icon-play" {...props} />,
  Pause: (props: Record<string, unknown>) => <span data-testid="icon-pause" {...props} />,
  RotateCcw: (props: Record<string, unknown>) => <span data-testid="icon-restart" {...props} />,
}));

function makeProps(overrides?: Partial<TimelineScrubberProps>): TimelineScrubberProps {
  return {
    position: 30_000,
    totalDuration: 300_000,
    playbackState: 'paused',
    speed: 1,
    markers: [],
    onPositionChange: vi.fn(),
    onPlayPause: vi.fn(),
    onSpeedChange: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  // Reset userSelect in case a test leaves it dirty
  document.body.style.userSelect = '';
});

describe('TimelineScrubber', () => {
  describe('rendering', () => {
    it('renders the playback timeline region', () => {
      render(<TimelineScrubber {...makeProps()} />);
      expect(screen.getByRole('region', { name: 'Playback timeline' })).toBeInTheDocument();
    });

    it('renders a slider element', () => {
      render(<TimelineScrubber {...makeProps()} />);
      expect(screen.getByRole('slider', { name: 'Session timeline' })).toBeInTheDocument();
    });

    it('renders play button when paused', () => {
      render(<TimelineScrubber {...makeProps()} />);
      expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    });

    it('renders pause button when playing', () => {
      render(<TimelineScrubber {...makeProps({ playbackState: 'playing' })} />);
      expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    });

    it('renders speed control buttons', () => {
      render(<TimelineScrubber {...makeProps()} />);
      expect(screen.getByRole('button', { name: /0\.5x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set speed to 1x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /1\.5x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set speed to 2x/i })).toBeInTheDocument();
    });

    it('displays total duration', () => {
      render(<TimelineScrubber {...makeProps({ totalDuration: 300_000 })} />);
      const timeDisplay = screen.getByText((_content, element) => {
        return element?.textContent === '00:30/05:00' || false;
      });
      expect(timeDisplay).toBeInTheDocument();
    });
  });

  describe('ARIA attributes', () => {
    it('has correct aria-valuemin on slider', () => {
      render(<TimelineScrubber {...makeProps()} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemin', '0');
    });

    it('has correct aria-valuemax on slider', () => {
      render(<TimelineScrubber {...makeProps({ totalDuration: 300_000 })} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuemax', '300000');
    });

    it('has correct aria-valuenow on slider', () => {
      render(<TimelineScrubber {...makeProps({ position: 60_000 })} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuenow', '60000');
    });

    it('has aria-valuetext for screen readers', () => {
      render(<TimelineScrubber {...makeProps({ position: 90_000 })} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-valuetext', '1 minute 30 seconds');
    });

    it('speed buttons have aria-pressed', () => {
      render(<TimelineScrubber {...makeProps({ speed: 1.5 })} />);
      const btn15 = screen.getByRole('button', { name: /set speed to 1\.5x/i });
      expect(btn15).toHaveAttribute('aria-pressed', 'true');
      const btn1 = screen.getByRole('button', { name: /set speed to 1x/i });
      expect(btn1).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('keyboard navigation', () => {
    it('ArrowRight advances position by 1 second', () => {
      const onPositionChange = vi.fn();
      render(<TimelineScrubber {...makeProps({ position: 10_000, onPositionChange })} />);
      const slider = screen.getByRole('slider');
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      expect(onPositionChange).toHaveBeenCalledWith(11_000);
    });

    it('ArrowLeft decreases position by 1 second', () => {
      const onPositionChange = vi.fn();
      render(<TimelineScrubber {...makeProps({ position: 10_000, onPositionChange })} />);
      const slider = screen.getByRole('slider');
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });
      expect(onPositionChange).toHaveBeenCalledWith(9_000);
    });

    it('ArrowLeft does not go below 0', () => {
      const onPositionChange = vi.fn();
      render(<TimelineScrubber {...makeProps({ position: 500, onPositionChange })} />);
      const slider = screen.getByRole('slider');
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });
      expect(onPositionChange).toHaveBeenCalledWith(0);
    });

    it('PageDown advances by 10 seconds', () => {
      const onPositionChange = vi.fn();
      render(<TimelineScrubber {...makeProps({ position: 5_000, onPositionChange })} />);
      const slider = screen.getByRole('slider');
      fireEvent.keyDown(slider, { key: 'PageDown' });
      expect(onPositionChange).toHaveBeenCalledWith(15_000);
    });

    it('PageUp decreases by 10 seconds', () => {
      const onPositionChange = vi.fn();
      render(<TimelineScrubber {...makeProps({ position: 15_000, onPositionChange })} />);
      const slider = screen.getByRole('slider');
      fireEvent.keyDown(slider, { key: 'PageUp' });
      expect(onPositionChange).toHaveBeenCalledWith(5_000);
    });

    it('Home jumps to start', () => {
      const onPositionChange = vi.fn();
      render(<TimelineScrubber {...makeProps({ position: 60_000, onPositionChange })} />);
      const slider = screen.getByRole('slider');
      fireEvent.keyDown(slider, { key: 'Home' });
      expect(onPositionChange).toHaveBeenCalledWith(0);
    });

    it('End jumps to end', () => {
      const onPositionChange = vi.fn();
      render(
        <TimelineScrubber
          {...makeProps({ position: 60_000, totalDuration: 300_000, onPositionChange })}
        />
      );
      const slider = screen.getByRole('slider');
      fireEvent.keyDown(slider, { key: 'End' });
      expect(onPositionChange).toHaveBeenCalledWith(300_000);
    });
  });

  describe('controls', () => {
    it('calls onPlayPause when play button is clicked', () => {
      const onPlayPause = vi.fn();
      render(<TimelineScrubber {...makeProps({ onPlayPause })} />);
      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
      expect(onPlayPause).toHaveBeenCalledOnce();
    });

    it('calls onSpeedChange when speed button is clicked', () => {
      const onSpeedChange = vi.fn();
      render(<TimelineScrubber {...makeProps({ onSpeedChange })} />);
      fireEvent.click(screen.getByRole('button', { name: /set speed to 2x/i }));
      expect(onSpeedChange).toHaveBeenCalledWith(2);
    });
  });

  describe('markers', () => {
    const testMarkers: TimelineMarker[] = [
      { timestamp: 60_000, type: 'snapshot', summary: 'Timing analysis' },
      { timestamp: 120_000, type: 'drill', summary: 'Scale drill' },
      { timestamp: 180_000, type: 'insight', summary: 'Speed ceiling detected' },
    ];

    it('renders marker buttons', () => {
      render(<TimelineScrubber {...makeProps({ markers: testMarkers })} />);
      expect(
        screen.getByRole('button', { name: /snapshot: timing analysis/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /drill: scale drill/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /insight: speed ceiling/i })).toBeInTheDocument();
    });

    it('clicking a marker jumps to that timestamp', () => {
      const onPositionChange = vi.fn();
      render(<TimelineScrubber {...makeProps({ markers: testMarkers, onPositionChange })} />);
      fireEvent.click(screen.getByRole('button', { name: /drill: scale drill/i }));
      expect(onPositionChange).toHaveBeenCalledWith(120_000);
    });

    it('shows tooltip on marker hover', () => {
      render(<TimelineScrubber {...makeProps({ markers: testMarkers })} />);
      const markerBtn = screen.getByRole('button', { name: /snapshot: timing analysis/i });
      fireEvent.mouseEnter(markerBtn);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByText('Timing analysis')).toBeInTheDocument();
    });

    it('hides tooltip on mouse leave', () => {
      render(<TimelineScrubber {...makeProps({ markers: testMarkers })} />);
      const markerBtn = screen.getByRole('button', { name: /snapshot: timing analysis/i });
      fireEvent.mouseEnter(markerBtn);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      fireEvent.mouseLeave(markerBtn);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('wraps markers in a semantic list with role="list" and aria-label (UI-H11)', () => {
      render(<TimelineScrubber {...makeProps({ markers: testMarkers })} />);
      const list = screen.getByRole('list', { name: 'Timeline markers' });
      expect(list).toBeInTheDocument();
    });

    it('each marker has role="listitem" (UI-H11)', () => {
      render(<TimelineScrubber {...makeProps({ markers: testMarkers })} />);
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(testMarkers.length);
    });

    it('does not render the marker list when there are no markers', () => {
      render(<TimelineScrubber {...makeProps({ markers: [] })} />);
      expect(screen.queryByRole('list', { name: 'Timeline markers' })).not.toBeInTheDocument();
    });

    it('ArrowRight moves focus to the next marker button', () => {
      render(<TimelineScrubber {...makeProps({ markers: testMarkers })} />);
      const firstMarker = screen.getByRole('button', { name: /snapshot: timing analysis/i });
      const secondMarker = screen.getByRole('button', { name: /drill: scale drill/i });
      act(() => {
        firstMarker.focus();
      });
      fireEvent.keyDown(firstMarker, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(secondMarker);
    });

    it('ArrowLeft moves focus to the previous marker button', () => {
      render(<TimelineScrubber {...makeProps({ markers: testMarkers })} />);
      const firstMarker = screen.getByRole('button', { name: /snapshot: timing analysis/i });
      const secondMarker = screen.getByRole('button', { name: /drill: scale drill/i });
      act(() => {
        secondMarker.focus();
      });
      fireEvent.keyDown(secondMarker, { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(firstMarker);
    });

    it('ArrowLeft on first marker keeps focus on first marker', () => {
      render(<TimelineScrubber {...makeProps({ markers: testMarkers })} />);
      const firstMarker = screen.getByRole('button', { name: /snapshot: timing analysis/i });
      act(() => {
        firstMarker.focus();
      });
      fireEvent.keyDown(firstMarker, { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(firstMarker);
    });

    it('ArrowRight on last marker keeps focus on last marker', () => {
      render(<TimelineScrubber {...makeProps({ markers: testMarkers })} />);
      const lastMarker = screen.getByRole('button', { name: /insight: speed ceiling/i });
      act(() => {
        lastMarker.focus();
      });
      fireEvent.keyDown(lastMarker, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(lastMarker);
    });
  });

  describe('keyboard shortcut suppression in text inputs (Story 28.3)', () => {
    it('suppresses global spacebar when an <input> is focused', () => {
      const onPlayPause = vi.fn();
      render(<TimelineScrubber {...makeProps({ onPlayPause })} />);
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      fireEvent.keyDown(input, { key: ' ' });
      expect(onPlayPause).not.toHaveBeenCalled();
      document.body.removeChild(input);
    });

    it('suppresses global spacebar when a <textarea> is focused', () => {
      const onPlayPause = vi.fn();
      render(<TimelineScrubber {...makeProps({ onPlayPause })} />);
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();
      fireEvent.keyDown(textarea, { key: ' ' });
      expect(onPlayPause).not.toHaveBeenCalled();
      document.body.removeChild(textarea);
    });

    it('suppresses global spacebar when a contenteditable element is focused', () => {
      const onPlayPause = vi.fn();
      render(<TimelineScrubber {...makeProps({ onPlayPause })} />);
      const div = document.createElement('div');
      div.contentEditable = 'true';
      document.body.appendChild(div);
      div.focus();
      fireEvent.keyDown(div, { key: ' ' });
      expect(onPlayPause).not.toHaveBeenCalled();
      document.body.removeChild(div);
    });
  });

  describe('speed announcement', () => {
    it('announces speed change for screen readers', () => {
      render(<TimelineScrubber {...makeProps()} />);
      fireEvent.click(screen.getByRole('button', { name: /set speed to 2x/i }));
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion?.textContent).toContain('Playback speed: 2x');
    });
  });

  describe('pointer capture cleanup on unmount (UI-C3)', () => {
    // jsdom does not implement setPointerCapture / releasePointerCapture,
    // so we stub them on the slider element after render.
    function stubPointerCapture(el: Element) {
      if (!el.setPointerCapture) {
        el.setPointerCapture = vi.fn();
      }
      if (!el.releasePointerCapture) {
        el.releasePointerCapture = vi.fn();
      }
    }

    it('restores document.body.style.userSelect when unmounted mid-drag', () => {
      // Confirm baseline
      expect(document.body.style.userSelect).toBe('');

      const { unmount } = render(<TimelineScrubber {...makeProps()} />);
      const slider = screen.getByRole('slider');
      stubPointerCapture(slider);

      // Simulate pointerdown to start drag — sets userSelect to 'none'
      fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });
      expect(document.body.style.userSelect).toBe('none');

      // Unmount mid-drag — cleanup effect should restore userSelect
      unmount();
      expect(document.body.style.userSelect).toBe('');
    });

    it('does not affect userSelect when unmounted without dragging', () => {
      expect(document.body.style.userSelect).toBe('');

      const { unmount } = render(<TimelineScrubber {...makeProps()} />);

      // Unmount without any pointer interaction
      unmount();
      expect(document.body.style.userSelect).toBe('');
    });

    it('restores original non-empty userSelect value on unmount (UI-M7)', () => {
      // Set a non-empty userSelect before rendering
      document.body.style.userSelect = 'text';

      const { unmount } = render(<TimelineScrubber {...makeProps()} />);
      const slider = screen.getByRole('slider');
      stubPointerCapture(slider);

      // Start drag — should overwrite to 'none'
      fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });
      expect(document.body.style.userSelect).toBe('none');

      // Unmount mid-drag — should restore original 'text'
      unmount();
      expect(document.body.style.userSelect).toBe('text');

      // Clean up for afterEach
      document.body.style.userSelect = '';
    });

    it('restores userSelect after pointerUp ends drag before unmount', () => {
      const { unmount } = render(<TimelineScrubber {...makeProps()} />);
      const slider = screen.getByRole('slider');
      stubPointerCapture(slider);

      // Start drag
      fireEvent.pointerDown(slider, { pointerId: 1, clientX: 50 });
      expect(document.body.style.userSelect).toBe('none');

      // End drag normally
      fireEvent.pointerUp(slider);
      expect(document.body.style.userSelect).toBe('');

      // Unmount after drag already ended — should still be clean
      unmount();
      expect(document.body.style.userSelect).toBe('');
    });
  });
});
