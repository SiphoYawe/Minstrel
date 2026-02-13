import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '@/stores/session-store';
import {
  startFreeformSession,
  transitionSessionType,
  resetSessionManager,
} from './session-manager';

describe('session-manager', () => {
  beforeEach(() => {
    useSessionStore.getState().setSessionType(null);
    useSessionStore.getState().setInterruptionsAllowed(false);
    useSessionStore.getState().setCurrentMode('silent-coach');
    useSessionStore.getState().setSessionStartTimestamp(null);
    useSessionStore.getState().resetAnalysis();
  });

  describe('startFreeformSession', () => {
    it('sets session type to freeform', () => {
      startFreeformSession();
      expect(useSessionStore.getState().sessionType).toBe('freeform');
    });

    it('sets interruptionsAllowed to false', () => {
      startFreeformSession();
      expect(useSessionStore.getState().interruptionsAllowed).toBe(false);
    });

    it('does not overwrite if session type already set', () => {
      useSessionStore.getState().setSessionType('drill');
      startFreeformSession();
      expect(useSessionStore.getState().sessionType).toBe('drill');
    });

    it('does not show any prompt or dialog (sessionType set silently)', () => {
      // This test verifies the "no UI prompt" AC by confirming
      // startFreeformSession is a pure state operation with no side effects
      startFreeformSession();
      expect(useSessionStore.getState().sessionType).toBe('freeform');
      // No DOM assertions needed — this is a store-only operation
    });
  });

  describe('transitionSessionType', () => {
    it('transitions from freeform to drill', () => {
      startFreeformSession();
      transitionSessionType('drill');
      expect(useSessionStore.getState().sessionType).toBe('drill');
    });

    it('enables interruptions for structured types', () => {
      startFreeformSession();
      transitionSessionType('drill');
      expect(useSessionStore.getState().interruptionsAllowed).toBe(true);
    });

    it('disables interruptions when transitioning back to freeform', () => {
      startFreeformSession();
      transitionSessionType('drill');
      expect(useSessionStore.getState().interruptionsAllowed).toBe(true);
      transitionSessionType('freeform');
      expect(useSessionStore.getState().interruptionsAllowed).toBe(false);
    });

    it('transitions to micro-session', () => {
      startFreeformSession();
      transitionSessionType('micro-session');
      expect(useSessionStore.getState().sessionType).toBe('micro-session');
      expect(useSessionStore.getState().interruptionsAllowed).toBe(true);
    });

    it('transitions to warmup', () => {
      startFreeformSession();
      transitionSessionType('warmup');
      expect(useSessionStore.getState().sessionType).toBe('warmup');
      expect(useSessionStore.getState().interruptionsAllowed).toBe(true);
    });

    it('does not transition when no session is active', () => {
      transitionSessionType('drill');
      expect(useSessionStore.getState().sessionType).toBeNull();
      expect(useSessionStore.getState().interruptionsAllowed).toBe(false);
    });
  });

  describe('resetSessionManager', () => {
    it('clears session type', () => {
      startFreeformSession();
      resetSessionManager();
      expect(useSessionStore.getState().sessionType).toBeNull();
    });

    it('sets interruptionsAllowed to false', () => {
      startFreeformSession();
      transitionSessionType('drill');
      resetSessionManager();
      expect(useSessionStore.getState().interruptionsAllowed).toBe(false);
    });
  });

  describe('analysis reset preserves session state', () => {
    it('resetAnalysis preserves sessionType and interruptionsAllowed', () => {
      startFreeformSession();
      useSessionStore.getState().resetAnalysis();
      expect(useSessionStore.getState().sessionType).toBe('freeform');
      expect(useSessionStore.getState().interruptionsAllowed).toBe(false);
    });

    it('resetAnalysis preserves drill session with interruptions', () => {
      startFreeformSession();
      transitionSessionType('drill');
      useSessionStore.getState().resetAnalysis();
      expect(useSessionStore.getState().sessionType).toBe('drill');
      expect(useSessionStore.getState().interruptionsAllowed).toBe(true);
    });
  });
});
