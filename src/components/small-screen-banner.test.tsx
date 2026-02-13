import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils/render';
import { SmallScreenBanner } from './small-screen-banner';

const DISMISS_KEY = 'minstrel:small-screen-banner-dismissed';

function createMockMatchMedia(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '(max-width: 767px)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

describe('SmallScreenBanner', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    window.matchMedia = vi.fn().mockReturnValue(createMockMatchMedia(false));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('renders nothing on large screens', () => {
    const { container } = render(<SmallScreenBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner on small screens', () => {
    window.matchMedia = vi.fn().mockReturnValue(createMockMatchMedia(true));
    render(<SmallScreenBanner />);
    expect(screen.getByText('Best experienced on a larger screen.')).toBeInTheDocument();
  });

  it('dismisses banner and persists to localStorage', () => {
    window.matchMedia = vi.fn().mockReturnValue(createMockMatchMedia(true));
    render(<SmallScreenBanner />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByText('Best experienced on a larger screen.')).not.toBeInTheDocument();
    expect(localStorage.getItem(DISMISS_KEY)).toBe('1');
  });

  it('does not render if previously dismissed', () => {
    localStorage.setItem(DISMISS_KEY, '1');
    window.matchMedia = vi.fn().mockReturnValue(createMockMatchMedia(true));
    const { container } = render(<SmallScreenBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('has role="status" for accessibility', () => {
    window.matchMedia = vi.fn().mockReturnValue(createMockMatchMedia(true));
    render(<SmallScreenBanner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('uses design token classes (no hardcoded hex)', () => {
    window.matchMedia = vi.fn().mockReturnValue(createMockMatchMedia(true));
    const { container } = render(<SmallScreenBanner />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/class="[^"]*#[0-9A-Fa-f]{3,8}[^"]*"/);
  });
});
