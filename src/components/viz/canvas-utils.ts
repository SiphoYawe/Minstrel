const BG_COLOR = '#0F0F0F';

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);
}

export function noteNumberToY(noteNumber: number, canvasHeight: number): number {
  // MIDI notes 0-127 mapped to canvas height (high notes at top, low at bottom)
  const normalized = 1 - noteNumber / 127;
  return normalized * canvasHeight;
}

export function velocityToAlpha(velocity: number): number {
  // Map velocity 0-127 to opacity 0.3-1.0
  return 0.3 + (velocity / 127) * 0.7;
}

export function velocityToSize(velocity: number): number {
  // Map velocity 0-127 to size multiplier 0.6-1.4
  return 0.6 + (velocity / 127) * 0.8;
}
