import { create } from "zustand";

export interface ShipmentLiveEvent {
  id: string;
  shipmentId: string;
  newStatus: string | null;
  occurredAt: string | null;
  receivedAt: number;
}

interface LiveState {
  connected: boolean;
  lastEventAt: number | null;
  recentEvents: ShipmentLiveEvent[];

  setConnected: (connected: boolean) => void;
  pushEvent: (event: ShipmentLiveEvent) => void;
  reset: () => void;
}

export const useLiveStore = create<LiveState>()((set) => ({
  connected: false,
  lastEventAt: null,
  recentEvents: [],

  setConnected: (connected) => set({ connected }),

  pushEvent: (event) =>
    set((state) => ({
      lastEventAt: event.receivedAt,
      recentEvents: [event, ...state.recentEvents].slice(0, 20),
    })),

  reset: () => set({ connected: false, lastEventAt: null, recentEvents: [] }),
}));
