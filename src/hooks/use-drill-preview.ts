'use client';

import { useState, useCallback, useRef } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { previewDrill } from '@/features/drills/drill-player';
import type { PlaybackHandle, DrillOutput } from '@/features/drills/drill-player';
import type { GeneratedDrill } from '@/features/drills/drill-types';

export type PreviewState = 'idle' | 'playing' | 'finished';

export interface DrillPreviewControls {
  state: PreviewState;
  activeNoteIndex: number;
  start: () => void;
  stop: () => void;
  repeat: () => void;
}

/**
 * Hook that manages drill preview playback state.
 * Resolves MIDI output vs Web Audio fallback automatically.
 */
export function useDrillPreview(drill: GeneratedDrill | null): DrillPreviewControls {
  const [state, setState] = useState<PreviewState>('idle');
  const [activeNoteIndex, setActiveNoteIndex] = useState(-1);
  const handleRef = useRef<PlaybackHandle | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const resolveOutput = useCallback((): DrillOutput => {
    const port = useMidiStore.getState().outputPort;
    if (port) {
      return { type: 'midi', port };
    }
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    return { type: 'audio', audioContext: audioCtxRef.current };
  }, []);

  const startPreview = useCallback(() => {
    if (!drill) return;

    // Stop any existing playback
    handleRef.current?.stop();

    const output = resolveOutput();
    setState('playing');
    setActiveNoteIndex(0);

    handleRef.current = previewDrill(drill, output, {
      onNotePlay: (_note, index) => {
        setActiveNoteIndex(index);
      },
      onComplete: () => {
        setState('finished');
        handleRef.current = null;
      },
    });
  }, [drill, resolveOutput]);

  const stop = useCallback(() => {
    handleRef.current?.stop();
    handleRef.current = null;
    setState('idle');
    setActiveNoteIndex(-1);
  }, []);

  const repeat = useCallback(() => {
    startPreview();
  }, [startPreview]);

  return { state, activeNoteIndex, start: startPreview, stop, repeat };
}
