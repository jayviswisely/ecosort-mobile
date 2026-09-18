import { create } from 'zustand';

export type ForecastWindow = 'now' | 'two_hours';

interface AutopilotState {
  forecast: ForecastWindow;
  selectedStationId: string;
  routeActive: boolean;
  completedStationIds: string[];
  setForecast: (forecast: ForecastWindow) => void;
  selectStation: (stationId: string) => void;
  optimizeRoute: () => void;
  completeNextStop: () => void;
  resetMission: () => void;
}

export const AUTOPILOT_ROUTE = ['north-loop', 'big-city', 'edge-lab', 'nthu'] as const;

export const useAutopilotStore = create<AutopilotState>((set) => ({
  forecast: 'now',
  selectedStationId: 'edge-lab',
  routeActive: false,
  completedStationIds: [],

  setForecast: (forecast) => set({ forecast }),
  selectStation: (selectedStationId) => set({ selectedStationId }),
  optimizeRoute: () =>
    set({
      forecast: 'two_hours',
      routeActive: true,
      completedStationIds: [],
      selectedStationId: AUTOPILOT_ROUTE[0],
    }),
  completeNextStop: () =>
    set((state) => {
      const nextStop = AUTOPILOT_ROUTE.find(
        (stationId) => !state.completedStationIds.includes(stationId),
      );

      if (!nextStop) return state;

      const completedStationIds = [...state.completedStationIds, nextStop];
      const followingStop = AUTOPILOT_ROUTE.find(
        (stationId) => !completedStationIds.includes(stationId),
      );

      return {
        completedStationIds,
        selectedStationId: followingStop ?? nextStop,
      };
    }),
  resetMission: () =>
    set({
      forecast: 'now',
      selectedStationId: 'edge-lab',
      routeActive: false,
      completedStationIds: [],
    }),
}));
