'use client';

import { useState, useEffect, useCallback } from 'react';

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
    shortcuts: [
      { keys: ['Space'], description: 'Start / Stop session' },
    ],
  },
  {
    label: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Toggle this panel' },
      { keys: ['Esc'], description: 'Dismiss panel' },
    ],
  },
];

export function KeyboardShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);

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
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
      data-testid="shortcuts-overlay"
    >
      <div
        className="w-full max-w-sm border border-border bg-background p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Keyboard shortcuts"
        aria-modal="true"
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
        <p className="mt-4 text-xs text-muted-foreground">
          Press <kbd className="border border-border bg-card px-1 font-mono text-xs">Esc</kbd> to
          close
        </p>
      </div>
    </div>
  );
}
