import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils/render';
import { DrillNoteVisualizer } from './drill-note-visualizer';
import type { DrillNote } from '@/features/drills/drill-types';

const sampleNotes: DrillNote[] = [
  { midiNote: 60, duration: 1, velocity: 80, startBeat: 0 },
  { midiNote: 64, duration: 1, velocity: 80, startBeat: 1 },
  { midiNote: 67, duration: 1, velocity: 80, startBeat: 2 },
];

describe('DrillNoteVisualizer', () => {
  it('renders nothing when notes array is empty', () => {
    const { container } = render(
      <DrillNoteVisualizer notes={[]} activeNoteIndex={-1} previewState="idle" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a note strip with aria-label describing note count', () => {
    render(<DrillNoteVisualizer notes={sampleNotes} activeNoteIndex={-1} previewState="idle" />);
    expect(screen.getByRole('img', { name: /3 notes/i })).toBeInTheDocument();
  });

  it('shows "Preview playing" text during playing state', () => {
    render(<DrillNoteVisualizer notes={sampleNotes} activeNoteIndex={1} previewState="playing" />);
    expect(screen.getByText(/preview playing/i)).toBeInTheDocument();
  });

  it('shows "Preview complete" text after finished state', () => {
    render(<DrillNoteVisualizer notes={sampleNotes} activeNoteIndex={2} previewState="finished" />);
    expect(screen.getByText(/preview complete/i)).toBeInTheDocument();
  });

  it('does not show status text in idle state', () => {
    const { container } = render(
      <DrillNoteVisualizer notes={sampleNotes} activeNoteIndex={-1} previewState="idle" />
    );
    expect(container.textContent).not.toContain('Preview playing');
    expect(container.textContent).not.toContain('Preview complete');
  });

  it('renders one span per note inside the strip', () => {
    render(<DrillNoteVisualizer notes={sampleNotes} activeNoteIndex={-1} previewState="idle" />);
    const strip = screen.getByRole('img', { name: /3 notes/i });
    // 3 note spans inside the strip container
    const noteBlocks = strip.querySelectorAll('span');
    expect(noteBlocks).toHaveLength(3);
  });
});
