'use client';

import { useEffect } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { requestMidiAccess, disconnectMidi } from './midi-engine';
import { isMidiSupported } from './midi-utils';

export function useMidi() {
  const connectionStatus = useMidiStore((s) => s.connectionStatus);
  const activeDevice = useMidiStore((s) => s.activeDevice);
  const availableDevices = useMidiStore((s) => s.availableDevices);
  const errorMessage = useMidiStore((s) => s.errorMessage);

  const isSupported = isMidiSupported();

  useEffect(() => {
    if (!isSupported) {
      useMidiStore.getState().setConnectionStatus('unsupported');
      useMidiStore
        .getState()
        .setErrorMessage('Minstrel works best in Chrome or Edge for full MIDI support.');
      return;
    }

    requestMidiAccess({
      onConnectionStatusChanged: (status) => useMidiStore.getState().setConnectionStatus(status),
      onDevicesChanged: (devices) => useMidiStore.getState().setAvailableDevices(devices),
      onActiveDeviceChanged: (device) => useMidiStore.getState().setActiveDevice(device),
      onError: (message) => useMidiStore.getState().setErrorMessage(message),
      onMidiEvent: (event) => useMidiStore.getState().addEvent(event),
    });

    return () => {
      disconnectMidi();
      useMidiStore.getState().reset();
    };
  }, [isSupported]);

  return {
    connectionStatus,
    activeDevice,
    availableDevices,
    errorMessage,
    isSupported,
  };
}
