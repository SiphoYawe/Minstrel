'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ShortcutGroup {
  label: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: 'Modes',
    shortcuts: [
      { keys: ['Alt', '1'], description: 'Silent Coach mode' },
      { keys: ['Alt', '2'], description: 'Dashboard + Chat mode' },
      { keys: ['Alt', '3'], description: 'Replay Studio mode' },
    ],
  },
  {
    label: 'Session',
    shortcuts: [{ keys: ['Space'], description: 'Start / Stop session' }],
  },
  {
    label: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Toggle this panel' },
      { keys: ['Esc'], description: 'Dismiss panel' },
    ],
  },
];

const FOCUSABLE_SELECTOR =
  'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function KeyboardShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<Element | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((v) => {
      if (!v) {
        // Opening: capture the current active element as trigger
        triggerRef.current = document.activeElement;
      }
      return !v;
    });
  }, []);

  // Focus the dialog when opened, restore focus when closed
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
    if (!isOpen && triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

  // Global keyboard handler for opening/closing
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === '?' && !isInput) {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close]);

  // Focus trap: cycle Tab within the dialog
  useEffect(() => {
    if (!isOpen) return;

    function handleFocusTrap(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );

      // If no focusable children, keep focus on the dialog itself
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first || document.activeElement === dialogRef.current) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', handleFocusTrap);
    return () => window.removeEventListener('keydown', handleFocusTrap);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={close}
      data-testid="shortcuts-overlay"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm border border-border bg-background p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Keyboard shortcuts"
        aria-modal="true"
        tabIndex={-1}
      >
        <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-primary">
          Keyboard Shortcuts
        </h2>
        <div className="flex flex-col gap-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              <span className="mb-2 block text-[10px] uppercase tracking-wider text-muted-foreground">
                {group.label}
              </span>
              <div className="flex flex-col gap-1">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm text-muted-foreground font-sans">
                      {shortcut.description}
                    </span>
                    <span className="flex items-center gap-1">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={key}
                          className="inline-flex h-6 min-w-[24px] items-center justify-center border border-border bg-card px-1.5 font-mono text-xs text-foreground"
                        >
                          {key}
                        </kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer bg-transparent border-none p-0"
          onClick={close}
          data-testid="shortcuts-close-btn"
        >
          Press <kbd className="border border-border bg-card px-1 font-mono text-xs">Esc</kbd> to
          close
        </button>
      </div>
    </div>
  );
}
