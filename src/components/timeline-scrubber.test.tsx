import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils/render';
import { TimelineScrubber } from './timeline-scrubber';
import type { TimelineScrubberProps, TimelineMarker } from './timeline-scrubber';

function makeProps(overrides?: Partial<TimelineScrubberProps>): TimelineScrubberProps {
  return {
    position: 30_000, // 30 seconds
    totalDuration: 300_000, // 5 minutes
    playbackState: 'paused',
    speed: 1,
    markers: [],
    onPositionChange: vi.fn(),
    onPlayPause: vi.fn(),
    onSpeedChange: vi.fn(),
    ...overrides,
  };
}

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
      expect(screen.getByText('05:00')).toBeInTheDocument();
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
  });

  describe('speed announcement', () => {
    it('announces speed change for screen readers', () => {
      render(<TimelineScrubber {...makeProps()} />);
      fireEvent.click(screen.getByRole('button', { name: /set speed to 2x/i }));
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion?.textContent).toContain('Playback speed: 2x');
    });
  });
});
