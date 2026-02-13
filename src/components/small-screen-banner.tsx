'use client';

import { useState, useEffect } from 'react';

const DISMISS_KEY = 'minstrel:small-screen-banner-dismissed';

export function SmallScreenBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    const mql = window.matchMedia('(max-width: 767px)');

    function handleChange(e: MediaQueryListEvent) {
      if (!localStorage.getItem(DISMISS_KEY)) {
        setVisible(e.matches);
      }
    }

    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  if (!visible) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  return (
    <div
      className="bg-card border-b border-border text-muted-foreground text-xs rounded-none flex items-center justify-between px-4 py-2"
      role="status"
    >
      <span>Best experienced on a larger screen.</span>
      <button
        onClick={handleDismiss}
        className="ml-4 shrink-0 text-muted-foreground hover:text-foreground transition-colors duration-150 font-mono text-[10px] uppercase tracking-wider"
        aria-label="Dismiss small screen notice"
      >
        Dismiss
      </button>
    </div>
  );
}
