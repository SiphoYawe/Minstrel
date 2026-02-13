'use client';

import { useEffect, useRef } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';
import type { MidiEvent } from '@/features/midi/midi-types';
import { renderNotes, createFadingNote } from './piano-roll-renderer';
import type { FadingNote } from './piano-roll-renderer';
import { renderTimingGrid } from './timing-grid-renderer';
import { renderHarmonicOverlay } from './harmonic-overlay-renderer';
import { renderSnapshotOverlay } from './snapshot-renderer';
import { SNAPSHOT_FADE_IN_MS, SNAPSHOT_FADE_OUT_MS } from '@/lib/constants';
import type {
  TimingEvent,
  KeyCenter,
  HarmonicFunction,
  NoteAnalysis,
  InstantSnapshot,
} from '@/features/analysis/analysis-types';

export function VisualizationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number>(0);
  const activeNotesRef = useRef<Record<number, MidiEvent>>({});
  const prevActiveNotesRef = useRef<Record<number, MidiEvent>>({});
  const fadingNotesRef = useRef<FadingNote[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const dirtyRef = useRef(true); // Start dirty to render initial blank canvas
  const chordLabelRef = useRef<string | null>(null);
  const tempoRef = useRef<number | null>(null);
  const timingDeviationsRef = useRef<TimingEvent[]>([]);
  const keyRef = useRef<KeyCenter | null>(null);
  const harmonicFnRef = useRef<HarmonicFunction | null>(null);
  const noteAnalysesRef = useRef<NoteAnalysis[]>([]);
  const snapshotRef = useRef<InstantSnapshot | null>(null);
  const snapshotAlphaRef = useRef(0);
  const snapshotTransitionRef = useRef<'none' | 'fade-in' | 'fade-out'>('none');
  const snapshotTransitionStartRef = useRef(0);
  const timingAccuracyRef = useRef(100);
  const prefersReducedMotionRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;

    // --- Prefers-reduced-motion detection ---
    const motionMql = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    if (motionMql) {
      prefersReducedMotionRef.current = motionMql.matches;
    }
    function handleMotionChange(e: MediaQueryListEvent) {
      prefersReducedMotionRef.current = e.matches;
      dirtyRef.current = true;
    }
    motionMql?.addEventListener('change', handleMotionChange);

    // --- Resize handling with devicePixelRatio ---
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = entry.contentRect;
      const w = Math.floor(rect.width * dpr);
      const h = Math.floor(rect.height * dpr);

      canvas.width = w;
      canvas.height = h;
      sizeRef.current = { w, h };
      dirtyRef.current = true;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    resizeObserver.observe(canvas);

    // --- Zustand vanilla subscription for active notes (bypass React cycle) ---
    const unsubMidi = useMidiStore.subscribe(
      (state) => state.activeNotes,
      (current) => {
        const prev = prevActiveNotesRef.current;

        // Detect released notes → create fading entries (skip if reduced motion)
        if (!prefersReducedMotionRef.current) {
          const canvasH = sizeRef.current.h / (window.devicePixelRatio || 1);
          const now = performance.now();
          for (const noteKey of Object.keys(prev)) {
            if (!(noteKey in current)) {
              fadingNotesRef.current.push(createFadingNote(prev[Number(noteKey)], canvasH, now));
            }
          }
        }

        activeNotesRef.current = current;
        prevActiveNotesRef.current = current;
        dirtyRef.current = true;
      }
    );

    // --- Zustand vanilla subscription for chord label from sessionStore ---
    const unsubSession = useSessionStore.subscribe(
      (state) => state.currentChordLabel,
      (label) => {
        chordLabelRef.current = label;
        dirtyRef.current = true;
      }
    );

    // --- Zustand vanilla subscriptions for timing data from sessionStore ---
    const unsubTempo = useSessionStore.subscribe(
      (state) => state.currentTempo,
      (tempo) => {
        tempoRef.current = tempo;
        dirtyRef.current = true;
        updateCanvasAriaLabel();
      }
    );
    const unsubDeviations = useSessionStore.subscribe(
      (state) => state.timingDeviations,
      (deviations) => {
        timingDeviationsRef.current = deviations;
        dirtyRef.current = true;
      }
    );

    // --- Zustand vanilla subscriptions for harmonic data from sessionStore ---
    const unsubKey = useSessionStore.subscribe(
      (state) => state.currentKey,
      (key) => {
        keyRef.current = key;
        dirtyRef.current = true;
        updateCanvasAriaLabel();
      }
    );
    const unsubHarmonicFn = useSessionStore.subscribe(
      (state) => state.currentHarmonicFunction,
      (fn) => {
        harmonicFnRef.current = fn;
        dirtyRef.current = true;
      }
    );
    const unsubNoteAnalyses = useSessionStore.subscribe(
      (state) => state.currentNoteAnalyses,
      (analyses) => {
        noteAnalysesRef.current = analyses;
        dirtyRef.current = true;
      }
    );

    // --- Zustand vanilla subscription for timing accuracy ---
    const unsubTimingAccuracy = useSessionStore.subscribe(
      (state) => state.timingAccuracy,
      (accuracy) => {
        timingAccuracyRef.current = accuracy;
        updateCanvasAriaLabel();
      }
    );

    function updateCanvasAriaLabel() {
      if (!canvas) return;
      const key = keyRef.current;
      const tempo = tempoRef.current;
      const accuracy = timingAccuracyRef.current;
      const noteCount = Object.keys(activeNotesRef.current).length;
      const label = key
        ? `Playing in ${key.root} ${key.mode}, ${tempo ?? '--'} BPM, timing accuracy ${Math.round(accuracy)}%`
        : 'Music visualization canvas';
      canvas.setAttribute('aria-label', label);

      // Update the live region for screen readers
      if (statusRef.current) {
        const description = key
          ? `Key: ${key.root} ${key.mode}. Tempo: ${tempo ?? '--'} BPM. Accuracy: ${Math.round(accuracy)}%. Active notes: ${noteCount}.`
          : noteCount > 0
            ? `${noteCount} note${noteCount !== 1 ? 's' : ''} playing.`
            : 'Waiting for input.';
        statusRef.current.textContent = description;
      }
    }

    // --- Zustand vanilla subscription for snapshot display mode ---
    const unsubSnapshot = useSessionStore.subscribe(
      (state) => state.currentSnapshot,
      (snapshot) => {
        if (snapshot) {
          snapshotRef.current = snapshot;
          snapshotTransitionRef.current = 'fade-in';
          snapshotTransitionStartRef.current = performance.now();
        } else if (snapshotRef.current) {
          snapshotTransitionRef.current = 'fade-out';
          snapshotTransitionStartRef.current = performance.now();
        }
        dirtyRef.current = true;
      }
    );

    // --- Render loop (60fps via requestAnimationFrame) ---
    function frame() {
      const c = ctxRef.current;
      if (!c) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      // Skip rendering when idle (no active notes, no fading, not dirty)
      const hasActive = Object.keys(activeNotesRef.current).length > 0;
      const hasFading = fadingNotesRef.current.length > 0;

      if (!dirtyRef.current && !hasActive && !hasFading) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      dirtyRef.current = false;

      const dpr = window.devicePixelRatio || 1;
      const logicalW = sizeRef.current.w / dpr;
      const logicalH = sizeRef.current.h / dpr;

      if (logicalW > 0 && logicalH > 0) {
        const now = performance.now();

        fadingNotesRef.current = renderNotes(
          c,
          activeNotesRef.current,
          fadingNotesRef.current,
          logicalW,
          logicalH,
          now,
          chordLabelRef.current
        );

        // Render timing grid in bottom band (separate vertical region)
        renderTimingGrid(c, logicalW, logicalH, tempoRef.current, timingDeviationsRef.current);

        // Render harmonic overlay (key label, roman numeral, chord-tone markers)
        renderHarmonicOverlay(
          c,
          logicalW,
          logicalH,
          keyRef.current,
          harmonicFnRef.current,
          noteAnalysesRef.current
        );

        // Snapshot transition animation (instant if reduced motion)
        if (snapshotTransitionRef.current !== 'none') {
          if (prefersReducedMotionRef.current) {
            // Skip animation — show/hide instantly
            snapshotAlphaRef.current = snapshotTransitionRef.current === 'fade-in' ? 1 : 0;
            if (snapshotAlphaRef.current <= 0) snapshotRef.current = null;
            snapshotTransitionRef.current = 'none';
          } else {
            const elapsed = now - snapshotTransitionStartRef.current;
            if (snapshotTransitionRef.current === 'fade-in') {
              snapshotAlphaRef.current = Math.min(elapsed / SNAPSHOT_FADE_IN_MS, 1);
              if (snapshotAlphaRef.current >= 1) snapshotTransitionRef.current = 'none';
            } else {
              snapshotAlphaRef.current = Math.max(1 - elapsed / SNAPSHOT_FADE_OUT_MS, 0);
              if (snapshotAlphaRef.current <= 0) {
                snapshotTransitionRef.current = 'none';
                snapshotRef.current = null;
              }
            }
          }
          dirtyRef.current = true;
        }

        // Render snapshot overlay if visible
        if (snapshotRef.current && snapshotAlphaRef.current > 0) {
          renderSnapshotOverlay(
            c,
            logicalW,
            logicalH,
            snapshotRef.current,
            snapshotAlphaRef.current
          );
        }

        // Keep rendering while fading notes remain or snapshot transitioning
        if (fadingNotesRef.current.length > 0 || snapshotTransitionRef.current !== 'none') {
          dirtyRef.current = true;
        }
      }

      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      unsubMidi();
      unsubSession();
      unsubTempo();
      unsubDeviations();
      unsubKey();
      unsubHarmonicFn();
      unsubNoteAnalyses();
      unsubSnapshot();
      unsubTimingAccuracy();
      motionMql?.removeEventListener('change', handleMotionChange);
      resizeObserver.disconnect();
      ctxRef.current = null;
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="MIDI note visualization"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          background: 'var(--background)',
        }}
      />
      <span
        ref={statusRef}
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        Waiting for input.
      </span>
    </>
  );
}
