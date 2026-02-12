import { create } from 'zustand';
import type { MidiConnectionStatus, MidiDeviceInfo, MidiStore } from '@/features/midi/midi-types';

const initialState = {
  connectionStatus: 'disconnected' as MidiConnectionStatus,
  activeDevice: null as MidiDeviceInfo | null,
  availableDevices: [] as MidiDeviceInfo[],
  errorMessage: null as string | null,
};

export const useMidiStore = create<MidiStore>()((set) => ({
  ...initialState,

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setActiveDevice: (device) => set({ activeDevice: device }),

  setAvailableDevices: (devices) => set({ availableDevices: devices }),

  setErrorMessage: (message) => set({ errorMessage: message }),

  reset: () =>
    set({
      connectionStatus: 'disconnected',
      activeDevice: null,
      availableDevices: [],
      errorMessage: null,
    }),
}));
