import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisualizationCanvas } from './visualization-canvas';

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', MockResizeObserver);

// Mock window.matchMedia
vi.stubGlobal(
  'matchMedia',
  vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
);

// Mock requestAnimationFrame / cancelAnimationFrame
let rafId = 0;
vi.stubGlobal('requestAnimationFrame', () => ++rafId);
vi.stubGlobal('cancelAnimationFrame', vi.fn());

// Mock canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillStyle: '',
  fillRect: vi.fn(),
  setTransform: vi.fn(),
  clearRect: vi.fn(),
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;

describe('VisualizationCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a canvas element', () => {
    render(<VisualizationCanvas />);
    const canvas = document.querySelector('canvas');
    expect(canvas).not.toBeNull();
  });

  it('canvas has role="img" for accessibility', () => {
    render(<VisualizationCanvas />);
    const canvas = screen.getByRole('img');
    expect(canvas).not.toBeNull();
  });

  it('canvas has aria-label', () => {
    render(<VisualizationCanvas />);
    const canvas = screen.getByLabelText('MIDI note visualization');
    expect(canvas).not.toBeNull();
  });

  it('canvas fills its container via inline styles', () => {
    render(<VisualizationCanvas />);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.style.width).toBe('100%');
    expect(canvas.style.height).toBe('100%');
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(<VisualizationCanvas />);
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
});
