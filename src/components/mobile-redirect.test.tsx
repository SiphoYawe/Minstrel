import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils/render';
import { MobileRedirect } from './mobile-redirect';

const MOBILE_DISMISS_KEY = 'minstrel:mobile-redirect-dismissed';
const MIDI_DISMISS_KEY = 'minstrel:midi-compat-dismissed';

describe('MobileRedirect', () => {
  const originalUserAgent = navigator.userAgent;
  const originalRequestMIDIAccess = navigator.requestMIDIAccess;
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    localStorage.clear();
    // Default: desktop, MIDI supported
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      configurable: true,
    });
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: vi.fn(),
      configurable: true,
    });
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: originalRequestMIDIAccess,
      configurable: true,
    });
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe('mobile overlay', () => {
    it('renders nothing on desktop with MIDI support', () => {
      const { container } = render(<MobileRedirect />);
      expect(container.textContent).toBe('');
    });

    it('shows overlay when mobile user agent detected', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        configurable: true,
      });
      render(<MobileRedirect />);
      expect(screen.getByText('Designed for desktop')).toBeInTheDocument();
    });

    it('shows overlay on small screen width (<768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 600,
        configurable: true,
      });
      render(<MobileRedirect />);
      expect(screen.getByText('Designed for desktop')).toBeInTheDocument();
    });

    it('shows "Continue anyway" button in mobile overlay', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Android 13; Mobile)',
        configurable: true,
      });
      render(<MobileRedirect />);
      expect(screen.getByRole('button', { name: /continue anyway/i })).toBeInTheDocument();
    });

    it('dismisses overlay and persists to localStorage', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        configurable: true,
      });
      render(<MobileRedirect />);
      fireEvent.click(screen.getByRole('button', { name: /continue anyway/i }));
      expect(screen.queryByText('Designed for desktop')).not.toBeInTheDocument();
      expect(localStorage.getItem(MOBILE_DISMISS_KEY)).toBe('1');
    });

    it('does not show overlay if previously dismissed', () => {
      localStorage.setItem(MOBILE_DISMISS_KEY, '1');
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        configurable: true,
      });
      render(<MobileRedirect />);
      expect(screen.queryByText('Designed for desktop')).not.toBeInTheDocument();
    });

    it('mobile overlay has alertdialog role', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        configurable: true,
      });
      render(<MobileRedirect />);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
  });

  describe('MIDI compatibility banner', () => {
    it('shows banner when MIDI is not supported', () => {
      Object.defineProperty(navigator, 'requestMIDIAccess', {
        value: undefined,
        configurable: true,
      });
      render(<MobileRedirect />);
      expect(screen.getByText(/your browser doesn't support midi/i)).toBeInTheDocument();
    });

    it('does not show MIDI banner when MIDI is supported', () => {
      render(<MobileRedirect />);
      expect(screen.queryByText(/your browser doesn't support midi/i)).not.toBeInTheDocument();
    });

    it('MIDI banner has alert role', () => {
      Object.defineProperty(navigator, 'requestMIDIAccess', {
        value: undefined,
        configurable: true,
      });
      render(<MobileRedirect />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('dismisses MIDI banner and persists to localStorage', () => {
      Object.defineProperty(navigator, 'requestMIDIAccess', {
        value: undefined,
        configurable: true,
      });
      render(<MobileRedirect />);
      fireEvent.click(screen.getByRole('button', { name: /dismiss midi/i }));
      expect(screen.queryByText(/your browser doesn't support midi/i)).not.toBeInTheDocument();
      expect(localStorage.getItem(MIDI_DISMISS_KEY)).toBe('1');
    });

    it('does not show MIDI banner if previously dismissed', () => {
      localStorage.setItem(MIDI_DISMISS_KEY, '1');
      Object.defineProperty(navigator, 'requestMIDIAccess', {
        value: undefined,
        configurable: true,
      });
      render(<MobileRedirect />);
      expect(screen.queryByText(/your browser doesn't support midi/i)).not.toBeInTheDocument();
    });

    it('MIDI banner is hidden when mobile overlay is showing', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        configurable: true,
      });
      Object.defineProperty(navigator, 'requestMIDIAccess', {
        value: undefined,
        configurable: true,
      });
      render(<MobileRedirect />);
      // Mobile overlay should be visible, MIDI banner should not
      expect(screen.getByText('Designed for desktop')).toBeInTheDocument();
      expect(screen.queryByText(/your browser doesn't support midi/i)).not.toBeInTheDocument();
    });
  });

  describe('aria-hidden on background content', () => {
    it('sets aria-hidden on main content when mobile overlay shows', () => {
      // Create a #main-content element in the document
      const mainContent = document.createElement('div');
      mainContent.id = 'main-content';
      document.body.appendChild(mainContent);

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        configurable: true,
      });
      render(<MobileRedirect />);

      expect(mainContent.getAttribute('aria-hidden')).toBe('true');

      document.body.removeChild(mainContent);
    });

    it('removes aria-hidden when overlay is dismissed', () => {
      const mainContent = document.createElement('div');
      mainContent.id = 'main-content';
      document.body.appendChild(mainContent);

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        configurable: true,
      });
      render(<MobileRedirect />);

      expect(mainContent.getAttribute('aria-hidden')).toBe('true');

      // Dismiss overlay
      fireEvent.click(screen.getByRole('button', { name: /continue anyway/i }));

      expect(mainContent.hasAttribute('aria-hidden')).toBe(false);

      document.body.removeChild(mainContent);
    });

    it('does not set aria-hidden when no overlay is showing', () => {
      const mainContent = document.createElement('div');
      mainContent.id = 'main-content';
      document.body.appendChild(mainContent);

      // Desktop, MIDI supported - no overlay
      render(<MobileRedirect />);

      expect(mainContent.hasAttribute('aria-hidden')).toBe(false);

      document.body.removeChild(mainContent);
    });
  });

  describe('design compliance', () => {
    it('uses design token classes (no hardcoded hex in mobile overlay)', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        configurable: true,
      });
      const { container } = render(<MobileRedirect />);
      const html = container.innerHTML;
      expect(html).not.toMatch(/class="[^"]*#[0-9A-Fa-f]{3,8}[^"]*"/);
    });

    it('uses design token classes (no hardcoded hex in MIDI banner)', () => {
      Object.defineProperty(navigator, 'requestMIDIAccess', {
        value: undefined,
        configurable: true,
      });
      const { container } = render(<MobileRedirect />);
      const html = container.innerHTML;
      expect(html).not.toMatch(/class="[^"]*#[0-9A-Fa-f]{3,8}[^"]*"/);
    });
  });
});
