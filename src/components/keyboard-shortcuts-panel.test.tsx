import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils/render';
import { KeyboardShortcutsPanel } from './keyboard-shortcuts-panel';

describe('KeyboardShortcutsPanel', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<KeyboardShortcutsPanel />);
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('opens when ? key is pressed', () => {
    render(<KeyboardShortcutsPanel />);

    fireEvent.keyDown(window, { key: '?' });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('closes when Escape is pressed', () => {
    render(<KeyboardShortcutsPanel />);

    // Open
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('toggles on repeated ? presses', () => {
    render(<KeyboardShortcutsPanel />);

    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: '?' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes when overlay is clicked', () => {
    render(<KeyboardShortcutsPanel />);

    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const overlay = screen.getByTestId('shortcuts-overlay');
    fireEvent.click(overlay);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not close when dialog content is clicked', () => {
    render(<KeyboardShortcutsPanel />);

    fireEvent.keyDown(window, { key: '?' });
    const dialog = screen.getByRole('dialog');

    fireEvent.click(dialog);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('displays all shortcut groups', () => {
    render(<KeyboardShortcutsPanel />);
    fireEvent.keyDown(window, { key: '?' });

    // Group labels
    expect(screen.getByText('Modes')).toBeInTheDocument();
    expect(screen.getByText('Session')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('displays mode shortcuts', () => {
    render(<KeyboardShortcutsPanel />);
    fireEvent.keyDown(window, { key: '?' });

    expect(screen.getByText('Silent Coach mode')).toBeInTheDocument();
    expect(screen.getByText('Dashboard + Chat mode')).toBeInTheDocument();
    expect(screen.getByText('Replay Studio mode')).toBeInTheDocument();
  });

  it('displays session shortcuts', () => {
    render(<KeyboardShortcutsPanel />);
    fireEvent.keyDown(window, { key: '?' });

    expect(screen.getByText('Start / Stop session')).toBeInTheDocument();
  });

  it('displays keyboard shortcut keys in kbd elements', () => {
    render(<KeyboardShortcutsPanel />);
    fireEvent.keyDown(window, { key: '?' });

    const kbdElements = screen.getAllByText('Alt');
    expect(kbdElements.length).toBe(3); // Alt+1, Alt+2, Alt+3
  });

  it('does not open when ? is typed in an input', () => {
    render(
      <div>
        <input data-testid="test-input" />
        <KeyboardShortcutsPanel />
      </div>
    );

    const input = screen.getByTestId('test-input');
    fireEvent.keyDown(input, { key: '?' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has aria-modal attribute', () => {
    render(<KeyboardShortcutsPanel />);
    fireEvent.keyDown(window, { key: '?' });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('shows escape hint text', () => {
    render(<KeyboardShortcutsPanel />);
    fireEvent.keyDown(window, { key: '?' });

    expect(screen.getByText(/close/)).toBeInTheDocument();
  });

  describe('focus trap', () => {
    it('moves focus to the dialog when opened', () => {
      render(<KeyboardShortcutsPanel />);
      fireEvent.keyDown(window, { key: '?' });

      const dialog = screen.getByRole('dialog');
      expect(document.activeElement).toBe(dialog);
    });

    it('returns focus to the trigger element when closed via Escape', () => {
      render(
        <div>
          <button data-testid="trigger-btn">Open</button>
          <KeyboardShortcutsPanel />
        </div>
      );

      // Focus the trigger button first
      const triggerBtn = screen.getByTestId('trigger-btn');
      triggerBtn.focus();
      expect(document.activeElement).toBe(triggerBtn);

      // Open panel
      fireEvent.keyDown(window, { key: '?' });
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Close panel via Escape
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(document.activeElement).toBe(triggerBtn);
    });

    it('traps Tab at the last focusable element and wraps to first', () => {
      render(<KeyboardShortcutsPanel />);
      fireEvent.keyDown(window, { key: '?' });

      const dialog = screen.getByRole('dialog');
      // The close button is the only focusable element inside
      const closeBtn = screen.getByTestId('shortcuts-close-btn');

      // Focus the close button (last/only focusable element)
      closeBtn.focus();
      expect(document.activeElement).toBe(closeBtn);

      // Tab forward from last element should wrap to first
      fireEvent.keyDown(window, { key: 'Tab' });
      expect(document.activeElement).toBe(closeBtn);
    });

    it('traps Shift+Tab at the first focusable element and wraps to last', () => {
      render(<KeyboardShortcutsPanel />);
      fireEvent.keyDown(window, { key: '?' });

      const dialog = screen.getByRole('dialog');
      const closeBtn = screen.getByTestId('shortcuts-close-btn');

      // Focus the dialog itself (which is before first focusable)
      dialog.focus();

      // Shift+Tab from dialog should wrap to last focusable
      fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(closeBtn);
    });

    it('has tabIndex=-1 on the dialog for programmatic focus', () => {
      render(<KeyboardShortcutsPanel />);
      fireEvent.keyDown(window, { key: '?' });

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('tabindex', '-1');
    });
  });
});
