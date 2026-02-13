'use client';

import { useEffect, useRef } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';
import type { MidiEvent } from '@/features/midi/midi-types';
import { renderNotes, createFadingNote } from './piano-roll-renderer';
import type { FadingNote } from './piano-roll-renderer';
import {
  renderTimingGrid,
  renderTimingPulses,
  renderFlowGlow,
  createTimingPulse,
} from './timing-grid-renderer';
import type { TimingPulse } from './timing-grid-renderer';
import { renderHarmonicOverlay } from './harmonic-overlay-renderer';
import { renderSnapshotOverlay } from './snapshot-renderer';
import { detectFlowState } from '@/features/analysis/flow-state-detector';
import { SNAPSHOT_FADE_IN_MS, SNAPSHOT_FADE_OUT_MS } from '@/lib/constants';
import type {
  TimingEvent,
  KeyCenter,
  HarmonicFunction,
  NoteAnalysis,
  InstantSnapshot,
  ChordQuality,
} from '@/features/analysis/analysis-types';
import type { SessionMode } from '@/features/modes/mode-types';

export function VisualizationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number>(0);
  const activeNotesRef = useRef<Record<number, MidiEvent>>({});
  const prevActiveNotesRef = useRef<Record<number, MidiEvent>>({});
  const fadingNotesRef = useRef<FadingNote[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const dirtyRef = useRef(true); // Start dirty to render initial blank canvas
  const chordLabelRef = useRef<string | null>(null);
  const chordQualityRef = useRef<ChordQuality | null>(null);
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
  // Replay mode indicator refs (Story 12.5)
  const currentModeRef = useRef<SessionMode>('silent-coach');
  const replayPositionRef = useRef(0);
  const replayTotalDurationRef = useRef(0);
  const replayStateRef = useRef<'paused' | 'playing'>('paused');
  // Timing pulse & flow state refs (Story 17.8)
  const timingPulsesRef = useRef<TimingPulse[]>([]);
  const prevDeviationCountRef = useRef(0);
  const isInFlowRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;

    // --- Prefers-reduced-motion detection ---
    const motionMql =
      typeof window.matchMedia === 'function'
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

    // --- Zustand vanilla subscription for chord quality (last detected chord) ---
    const unsubChordQuality = useSessionStore.subscribe(
      (state) => state.detectedChords,
      (chords) => {
        chordQualityRef.current = chords.length > 0 ? chords[chords.length - 1].quality : null;
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
        // Create timing pulses for newly arrived deviations (Story 17.8)
        const prevCount = prevDeviationCountRef.current;
        if (deviations.length > prevCount && tempoRef.current) {
          const dpr = window.devicePixelRatio || 1;
          const logicalW = sizeRef.current.w / dpr;
          const logicalH = sizeRef.current.h / dpr;
          const bandTop = logicalH * 0.8;
          const bandHeight = logicalH * 0.15;
          const nowMs = performance.now();

          for (let i = prevCount; i < deviations.length; i++) {
            const pulse = createTimingPulse(
              deviations[i],
              logicalW,
              bandTop,
              bandHeight,
              tempoRef.current,
              deviations,
              nowMs
            );
            if (pulse) timingPulsesRef.current.push(pulse);
          }
        }
        prevDeviationCountRef.current = deviations.length;
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

    // --- Zustand vanilla subscription for mode changes (Story 12.2 + 12.5) ---
    // Clear all note state when switching between live and replay modes
    const unsubMode = useSessionStore.subscribe(
      (state) => state.currentMode,
      (mode) => {
        currentModeRef.current = mode;
        useMidiStore.getState().clearEvents();
        activeNotesRef.current = {};
        prevActiveNotesRef.current = {};
        fadingNotesRef.current = [];
        dirtyRef.current = true;
        // Toggle replay border on container (Story 12.5)
        if (containerRef.current) {
          if (mode === 'replay-studio') {
            containerRef.current.classList.add('replay-active');
          } else {
            containerRef.current.classList.remove('replay-active');
          }
        }
      }
    );

    // --- Zustand vanilla subscriptions for replay playback head (Story 12.5) ---
    const unsubReplayPosition = useSessionStore.subscribe(
      (state) => state.replayPosition,
      (position) => {
        replayPositionRef.current = position;
        if (currentModeRef.current === 'replay-studio') {
          dirtyRef.current = true;
        }
      }
    );

    const unsubReplayState = useSessionStore.subscribe(
      (state) => state.replayState,
      (state) => {
        replayStateRef.current = state;
        if (currentModeRef.current === 'replay-studio') {
          dirtyRef.current = true;
        }
      }
    );

    // Track total duration from replaySession for playback head rendering
    const unsubReplaySession = useSessionStore.subscribe(
      (state) => state.replaySession,
      (session) => {
        if (session) {
          if (session.duration) {
            replayTotalDurationRef.current = session.duration * 1000;
          } else if (session.endedAt && session.startedAt) {
            replayTotalDurationRef.current = session.endedAt - session.startedAt;
          } else {
            replayTotalDurationRef.current = 0;
          }
        } else {
          replayTotalDurationRef.current = 0;
        }
        dirtyRef.current = true;
      }
    );

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

        // Render timing pulses (Story 17.8)
        if (timingPulsesRef.current.length > 0) {
          timingPulsesRef.current = renderTimingPulses(
            c,
            timingPulsesRef.current,
            now,
            prefersReducedMotionRef.current
          );
          if (timingPulsesRef.current.length > 0) {
            dirtyRef.current = true;
          }
        }

        // Flow state detection & glow (Story 17.8)
        const flowState = detectFlowState(timingDeviationsRef.current, Date.now());
        isInFlowRef.current = flowState.isInFlow;
        if (flowState.isInFlow) {
          renderFlowGlow(c, logicalW, logicalH, now, prefersReducedMotionRef.current);
          dirtyRef.current = true; // Keep animating glow pulse
        }

        // Render harmonic overlay (key label, chord block, roman numeral, chord-tone markers)
        renderHarmonicOverlay(
          c,
          logicalW,
          logicalH,
          keyRef.current,
          harmonicFnRef.current,
          noteAnalysesRef.current,
          chordLabelRef.current,
          chordQualityRef.current
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

        // --- Replay mode overlay (Story 12.5) ---
        if (currentModeRef.current === 'replay-studio') {
          // "REPLAY" label in top-left
          c.save();
          c.font = 'bold 14px Inter, sans-serif';
          c.letterSpacing = '2px';
          c.fillStyle = 'rgba(255, 191, 0, 0.4)'; // Amber at 40%
          c.fillText('REPLAY', 16, 28);
          c.restore();

          // Playback-head vertical line
          const totalDur = replayTotalDurationRef.current;
          if (totalDur > 0) {
            const ratio = Math.min(replayPositionRef.current / totalDur, 1);
            const headX = ratio * logicalW;
            const isPaused = replayStateRef.current === 'paused';

            let headAlpha = 0.6;
            if (isPaused && !prefersReducedMotionRef.current) {
              // Pulse alpha between 0.3 and 0.7 when paused
              headAlpha = 0.5 + 0.2 * Math.sin(now * 0.004);
            }

            c.save();
            c.strokeStyle = `rgba(255, 191, 0, ${headAlpha})`;
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(headX, 0);
            c.lineTo(headX, logicalH);
            c.stroke();
            c.restore();
          }

          // Keep rendering during replay for playback head animation
          dirtyRef.current = true;
        }

        // Keep rendering while fading notes, timing pulses, or snapshot transitioning
        if (
          fadingNotesRef.current.length > 0 ||
          timingPulsesRef.current.length > 0 ||
          isInFlowRef.current ||
          snapshotTransitionRef.current !== 'none'
        ) {
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
      unsubChordQuality();
      unsubTempo();
      unsubDeviations();
      unsubKey();
      unsubHarmonicFn();
      unsubNoteAnalyses();
      unsubMode();
      unsubReplayPosition();
      unsubReplayState();
      unsubReplaySession();
      unsubSnapshot();
      unsubTimingAccuracy();
      motionMql?.removeEventListener('change', handleMotionChange);
      resizeObserver.disconnect();
      ctxRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full [&.replay-active]:border-2 [&.replay-active]:border-accent-warm/30"
      style={{ position: 'relative' }}
    >
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
      <span ref={statusRef} role="status" aria-live="polite" className="sr-only">
        Waiting for input.
      </span>
    </div>
  );
}
