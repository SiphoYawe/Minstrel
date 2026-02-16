/**
 * Visualization Color Tokens — mirrors CSS custom properties for Canvas 2D API.
 *
 * Canvas context cannot use CSS variables directly, so these constants
 * provide the same design-system colors as rgba() strings.
 * Keep in sync with --viz-* variables in globals.css.
 */

// RGB components matching CSS --viz-*-rgb custom properties
export const VIZ_PRIMARY_RGB = { r: 124, g: 185, b: 232 };
export const VIZ_BACKGROUND_RGB = { r: 15, g: 15, b: 15 };
export const VIZ_WARM_RGB = { r: 232, g: 199, b: 123 };
export const VIZ_HARMONIC_RGB = { r: 180, g: 167, b: 214 };
export const VIZ_TIMING_RGB = { r: 168, g: 213, b: 186 };
export const VIZ_MUTED_RGB = { r: 102, g: 102, b: 102 };
export const VIZ_WHITE_RGB = { r: 255, g: 255, b: 255 };

/** Helper: build rgba() string from RGB components + alpha. */
export function vizRgba(rgb: { r: number; g: number; b: number }, alpha: number): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

// Harmonic function colors (matching chord-hud FUNCTION_COLORS)
export const VIZ_FUNCTION_TONIC = 'hsl(206, 70%, 70%)';
export const VIZ_FUNCTION_DOMINANT = 'hsl(42, 70%, 70%)';
export const VIZ_FUNCTION_SUBDOMINANT = 'hsl(257, 36%, 75%)';
export const VIZ_FUNCTION_DEFAULT = 'hsl(0, 0%, 40%)';
