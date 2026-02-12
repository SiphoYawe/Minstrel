/**
 * Check if the Web MIDI API is available in the current browser.
 * Only Chromium-based browsers (Chrome, Edge, Opera) support it.
 */
export function isMidiSupported(): boolean {
  return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
}
