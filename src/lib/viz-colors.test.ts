import { describe, it, expect } from 'vitest';
import {
  VIZ_PRIMARY_RGB,
  VIZ_BACKGROUND_RGB,
  VIZ_WARM_RGB,
  VIZ_HARMONIC_RGB,
  VIZ_TIMING_RGB,
  VIZ_MUTED_RGB,
  VIZ_WHITE_RGB,
  vizRgba,
} from './viz-colors';

describe('viz-colors', () => {
  it('exports correct primary RGB values', () => {
    expect(VIZ_PRIMARY_RGB).toEqual({ r: 124, g: 185, b: 232 });
  });

  it('exports correct background RGB values', () => {
    expect(VIZ_BACKGROUND_RGB).toEqual({ r: 15, g: 15, b: 15 });
  });

  it('exports correct warm RGB values', () => {
    expect(VIZ_WARM_RGB).toEqual({ r: 232, g: 199, b: 123 });
  });

  it('exports correct harmonic RGB values', () => {
    expect(VIZ_HARMONIC_RGB).toEqual({ r: 180, g: 167, b: 214 });
  });

  it('exports correct timing RGB values', () => {
    expect(VIZ_TIMING_RGB).toEqual({ r: 168, g: 213, b: 186 });
  });

  it('exports correct muted RGB values', () => {
    expect(VIZ_MUTED_RGB).toEqual({ r: 102, g: 102, b: 102 });
  });

  it('exports correct white RGB values', () => {
    expect(VIZ_WHITE_RGB).toEqual({ r: 255, g: 255, b: 255 });
  });

  describe('vizRgba', () => {
    it('builds rgba string from RGB + alpha', () => {
      expect(vizRgba(VIZ_PRIMARY_RGB, 0.7)).toBe('rgba(124, 185, 232, 0.7)');
    });

    it('handles alpha of 1', () => {
      expect(vizRgba(VIZ_BACKGROUND_RGB, 1)).toBe('rgba(15, 15, 15, 1)');
    });

    it('handles alpha of 0', () => {
      expect(vizRgba(VIZ_WARM_RGB, 0)).toBe('rgba(232, 199, 123, 0)');
    });
  });
});
