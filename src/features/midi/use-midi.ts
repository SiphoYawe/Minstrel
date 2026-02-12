'use client';

import { useEffect, useCallback } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { requestMidiAccess, disconnectMidi } from './midi-engine';
import { requestAudioAccess, stopAudioListening, isAudioSupported } from './audio-engine';
import { isMidiSupported } from './midi-utils';
import { isDrumChannel } from './troubleshooting';
import type { MidiEngineCallbacks } from './midi-engine';

const TROUBLESHOOT_TIMEOUT_MS = 3000;

function createMidiCallbacks(): MidiEngineCallbacks {
  let channelChecked = false;

  return {
    onConnectionStatusChanged: (status) => {
      const store = useMidiStore.getState();

      // Auto-switch from audio to MIDI when a device connects
      if (status === 'connected' && store.inputSource === 'audio') {
        // Set source first so any final note-off from stopAudioListening
        // arrives while store already reflects MIDI mode
        store.setInputSource('midi');
        stopAudioListening();
      }

      store.setConnectionStatus(status);

      if (status === 'connected') {
        store.setInputSource('midi');
        store.setShowTroubleshooting(false);
      }
    },
    onDevicesChanged: (devices) => useMidiStore.getState().setAvailableDevices(devices),
    onActiveDeviceChanged: (device) => useMidiStore.getState().setActiveDevice(device),
    onError: (message) => useMidiStore.getState().setErrorMessage(message),
    onMidiEvent: (event) => {
      useMidiStore.getState().addEvent(event);

      // Detect drum channel from first note-on event
      if (!channelChecked && event.type === 'note-on') {
        channelChecked = true;
        if (isDrumChannel(event.channel)) {
          useMidiStore.getState().setDetectedChannel(event.channel);
          useMidiStore.getState().setShowTroubleshooting(true);
        }
      }
    },
  };
}

export function useMidi() {
  const connectionStatus = useMidiStore((s) => s.connectionStatus);
  const activeDevice = useMidiStore((s) => s.activeDevice);
  const availableDevices = useMidiStore((s) => s.availableDevices);
  const errorMessage = useMidiStore((s) => s.errorMessage);
  const showTroubleshooting = useMidiStore((s) => s.showTroubleshooting);
  const detectedChannel = useMidiStore((s) => s.detectedChannel);
  const inputSource = useMidiStore((s) => s.inputSource);

  const isSupported = isMidiSupported();

  useEffect(() => {
    if (!isSupported) {
      const audioSupported = isAudioSupported();
      useMidiStore.getState().setConnectionStatus('unsupported');
      useMidiStore
        .getState()
        .setErrorMessage(
          audioSupported
            ? 'Minstrel works best in Chrome or Edge for full MIDI support.'
            : 'Your browser cannot capture instrument input. Please use Chrome or Edge.'
        );
      return;
    }

    requestMidiAccess(createMidiCallbacks());

    // Show troubleshooting after timeout if no device found
    const timer = setTimeout(() => {
      const { connectionStatus: status } = useMidiStore.getState();
      if (status !== 'connected') {
        useMidiStore.getState().setShowTroubleshooting(true);
      }
    }, TROUBLESHOOT_TIMEOUT_MS);

    return () => {
      clearTimeout(timer);
      stopAudioListening();
      disconnectMidi();
      useMidiStore.getState().reset();
    };
  }, [isSupported]);

  const retryConnection = useCallback(async () => {
    // Tear down previous connection before retrying
    disconnectMidi();
    useMidiStore.getState().setConnectionStatus('connecting');
    useMidiStore.getState().setDetectedChannel(null);
    await requestMidiAccess(createMidiCallbacks());
  }, []);

  const startAudioMode = useCallback(async () => {
    useMidiStore.getState().setShowTroubleshooting(false);
    await requestAudioAccess();
  }, []);

  const dismissTroubleshooting = useCallback(() => {
    useMidiStore.getState().setShowTroubleshooting(false);
  }, []);

  return {
    connectionStatus,
    activeDevice,
    availableDevices,
    errorMessage,
    isSupported,
    showTroubleshooting,
    detectedChannel,
    inputSource,
    retryConnection,
    startAudioMode,
    dismissTroubleshooting,
  };
}
