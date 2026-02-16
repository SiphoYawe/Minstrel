'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const MOBILE_DISMISS_KEY = 'minstrel:mobile-redirect-dismissed';
const MIDI_DISMISS_KEY = 'minstrel:midi-compat-dismissed';

function isMobileUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isSmallScreen(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

function hasMidiSupport(): boolean {
  if (typeof navigator === 'undefined') return true; // Assume support during SSR
  return typeof navigator.requestMIDIAccess === 'function';
}

export function MobileRedirect() {
  const [showMobileOverlay, setShowMobileOverlay] = useState(() => {
    if (typeof window === 'undefined') return false;
    const dismissed = localStorage.getItem(MOBILE_DISMISS_KEY);
    return !dismissed && (isMobileUserAgent() || isSmallScreen());
  });
  const [showMidiBanner, setShowMidiBanner] = useState(() => {
    if (typeof window === 'undefined') return false;
    const dismissed = localStorage.getItem(MIDI_DISMISS_KEY);
    return !dismissed && !hasMidiSupport();
  });

  function handleMobileDismiss() {
    localStorage.setItem(MOBILE_DISMISS_KEY, '1');
    setShowMobileOverlay(false);
  }

  function handleMidiDismiss() {
    localStorage.setItem(MIDI_DISMISS_KEY, '1');
    setShowMidiBanner(false);
  }

  // Toggle aria-hidden on main content when mobile overlay is visible
  useEffect(() => {
    if (!showMobileOverlay) return;
    const main = document.getElementById('main-content');
    if (!main) return;
    main.setAttribute('aria-hidden', 'true');
    return () => {
      main.removeAttribute('aria-hidden');
    };
  }, [showMobileOverlay]);

  return (
    <>
      {/* Full-screen mobile overlay */}
      {showMobileOverlay && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background p-8 text-center"
          role="alertdialog"
          aria-modal="true"
          aria-label="Mobile device detected"
        >
          <Image
            src="/minstrel-logo-white.svg"
            alt="Minstrel"
            width={120}
            height={30}
            className="mb-8 h-6 w-auto opacity-60"
          />
          <p className="text-lg font-medium text-foreground mb-3">Designed for desktop</p>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
            Minstrel requires a desktop browser with MIDI support. Open on your computer for the
            best experience.
          </p>
          <button
            onClick={handleMobileDismiss}
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-accent-warm hover:text-foreground border border-accent-warm/20 hover:border-accent-warm/50 px-4 py-2 transition-colors duration-150"
          >
            Continue anyway
          </button>
        </div>
      )}

      {/* MIDI incompatibility banner */}
      {showMidiBanner && !showMobileOverlay && (
        <div
          className="fixed inset-x-0 top-0 z-[70] flex items-center justify-between border-b border-accent-warm/20 bg-accent-warm/10 px-4 py-2"
          role="alert"
        >
          <p className="font-mono text-xs text-accent-warm">
            Your browser doesn&apos;t support MIDI. Use Chrome or Edge for the best experience.
          </p>
          <button
            onClick={handleMidiDismiss}
            className="ml-4 shrink-0 font-mono text-[10px] uppercase tracking-wider text-accent-warm hover:text-foreground transition-colors duration-150"
            aria-label="Dismiss MIDI compatibility notice"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
