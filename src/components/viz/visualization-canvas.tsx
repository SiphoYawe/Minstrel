'use client';

import { useEffect, useRef } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import type { MidiEvent } from '@/features/midi/midi-types';
import { renderNotes, createFadingNote } from './piano-roll-renderer';
import type { FadingNote } from './piano-roll-renderer';

export function VisualizationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number>(0);
  const activeNotesRef = useRef<Record<number, MidiEvent>>({});
  const prevActiveNotesRef = useRef<Record<number, MidiEvent>>({});
  const fadingNotesRef = useRef<FadingNote[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const dirtyRef = useRef(true); // Start dirty to render initial blank canvas

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;

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

    // --- Zustand vanilla subscription (AR13: bypass React cycle) ---
    const unsubscribe = useMidiStore.subscribe(
      (state) => state.activeNotes,
      (current) => {
        const prev = prevActiveNotesRef.current;

        // Detect released notes → create fading entries
        const canvasH = sizeRef.current.h / (window.devicePixelRatio || 1);
        const now = performance.now();
        for (const noteKey of Object.keys(prev)) {
          if (!(noteKey in current)) {
            fadingNotesRef.current.push(createFadingNote(prev[Number(noteKey)], canvasH, now));
          }
        }

        activeNotesRef.current = current;
        prevActiveNotesRef.current = current;
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
        fadingNotesRef.current = renderNotes(
          c,
          activeNotesRef.current,
          fadingNotesRef.current,
          logicalW,
          logicalH,
          performance.now()
        );

        // Keep rendering while fading notes remain
        if (fadingNotesRef.current.length > 0) {
          dirtyRef.current = true;
        }
      }

      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      unsubscribe();
      resizeObserver.disconnect();
      ctxRef.current = null;
    };
  }, []);

  return (
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
  );
}
