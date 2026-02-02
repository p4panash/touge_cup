/**
 * Debug Store
 *
 * Stores recent logs for in-app viewing.
 * Useful for debugging when not connected to Xcode.
 */

import { create } from 'zustand';

interface LogEntry {
  timestamp: number;
  message: string;
}

interface DebugStoreState {
  logs: LogEntry[];
  maxLogs: number;
}

interface DebugStoreActions {
  addLog: (message: string) => void;
  clearLogs: () => void;
}

type DebugStore = DebugStoreState & DebugStoreActions;

export const useDebugStore = create<DebugStore>((set) => ({
  logs: [],
  maxLogs: 200, // Keep last 200 logs

  addLog: (message: string) => {
    set((state) => {
      const newLog = { timestamp: Date.now(), message };
      const logs = [newLog, ...state.logs].slice(0, state.maxLogs);
      return { logs };
    });
  },

  clearLogs: () => {
    set({ logs: [] });
  },
}));

/**
 * Helper to log to both console and debug store
 */
export function debugLog(message: string): void {
  console.log(message);
  useDebugStore.getState().addLog(message);
}
