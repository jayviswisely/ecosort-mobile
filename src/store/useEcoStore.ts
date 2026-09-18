import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createInitialAlerts } from '@/data/initialData';
import { simulatedEdgeDataSource } from '@/services/edge';
import type {
  AlertType,
  BinAlert,
  BinCategory,
  DetectionNotice,
  DisposalEvent,
  EdgeUpdate,
  SmartBin,
} from '@/types';
import { getStatusLabel } from '@/utils/bin';

interface EcoState {
  station: string;
  bins: SmartBin[];
  events: DisposalEvent[];
  alerts: BinAlert[];
  notice: DetectionNotice | null;
  isReady: boolean;
  initialize: () => Promise<void>;
  dispose: () => void;
  setDemoFill: (category: BinCategory, fillPercent: number) => void;
  simulateDisposal: (
    detectedObject: 'PET Bottle' | 'Aluminum Can' | 'Tissue' | 'Snack Wrapper',
  ) => void;
  simulateOffline: (category: BinCategory) => void;
  markEmptied: (category: BinCategory) => void;
  acknowledgeAlert: (alertId: string) => void;
  acknowledgeAll: () => void;
  clearNotice: () => void;
  resetDemo: () => void;
}

let unsubscribeFromEdge: (() => void) | undefined;

function buildAlert(bin: SmartBin, type: AlertType): BinAlert {
  const message =
    type === 'offline'
      ? `${bin.name} sensor stopped reporting.`
      : `${bin.name} has reached ${bin.fillPercent}% capacity.`;

  return {
    id: `alert-${bin.id}-${type}-${Date.now()}`,
    binId: bin.id,
    type,
    message,
    timestamp: new Date().toISOString(),
    acknowledged: false,
  };
}

function applyBinUpdate(
  bins: SmartBin[],
  alerts: BinAlert[],
  nextBin: SmartBin,
): { bins: SmartBin[]; alerts: BinAlert[] } {
  const previous = bins.find((bin) => bin.id === nextBin.id);
  const alertType: AlertType | null =
    nextBin.status !== 'normal' && previous?.status !== nextBin.status
      ? nextBin.status
      : null;

  return {
    bins: bins.map((bin) => (bin.id === nextBin.id ? nextBin : bin)),
    alerts: alertType
      ? [buildAlert(nextBin, alertType), ...alerts].slice(0, 50)
      : alerts,
  };
}

export const useEcoStore = create<EcoState>()(
  persist(
    (set, get) => {
      const handleEdgeUpdate = (update: EdgeUpdate) => {
        if (update.type === 'bin_updated') {
          set((state) => applyBinUpdate(state.bins, state.alerts, update.bin));
          return;
        }

        if (update.type === 'event_added') {
          set((state) => {
            const updated = update.bin
              ? applyBinUpdate(state.bins, state.alerts, update.bin)
              : { bins: state.bins, alerts: state.alerts };
            const isMaintenance = update.event.kind === 'maintenance';
            const binName = update.event.category[0].toUpperCase() + update.event.category.slice(1);

            return {
              ...updated,
              events: [update.event, ...state.events].slice(0, 50),
              notice: {
                id: update.event.id,
                title: isMaintenance
                  ? `${binName} bin emptied`
                  : `${update.event.detectedObject} detected`,
                message: isMaintenance ? 'Fill level reset to 3%' : `→ ${binName} Bin`,
              },
            };
          });
          return;
        }

        set({
          bins: update.bins,
          events: update.events,
          alerts: createInitialAlerts(),
          notice: {
            id: `notice-reset-${Date.now()}`,
            title: 'Demo reset',
            message: 'Initial EcoSort data restored',
          },
        });
      };

      return {
        station: 'NCKU Dormitory A',
        bins: [],
        events: [],
        alerts: [],
        notice: null,
        isReady: false,

        initialize: async () => {
          if (get().isReady) return;

          let { bins, events, alerts } = get();
          if (bins.length === 0 || events.length === 0) {
            [bins, events] = await Promise.all([
              simulatedEdgeDataSource.getBins(),
              simulatedEdgeDataSource.getRecentEvents(),
            ]);
            if (alerts.length === 0) alerts = createInitialAlerts();
            set({ bins, events, alerts });
          } else {
            simulatedEdgeDataSource.seed(bins, events);
          }

          unsubscribeFromEdge ??=
            simulatedEdgeDataSource.subscribeToUpdates(handleEdgeUpdate);
          set({ isReady: true });
        },

        dispose: () => {
          unsubscribeFromEdge?.();
          unsubscribeFromEdge = undefined;
        },

        setDemoFill: (category, fillPercent) =>
          simulatedEdgeDataSource.setFillLevel(category, fillPercent),

        simulateDisposal: (detectedObject) =>
          simulatedEdgeDataSource.simulateDisposal(detectedObject),

        simulateOffline: (category) =>
          simulatedEdgeDataSource.setSensorOffline(category),

        markEmptied: (category) => simulatedEdgeDataSource.markEmptied(category),

        acknowledgeAlert: (alertId) =>
          set((state) => ({
            alerts: state.alerts.map((alert) =>
              alert.id === alertId ? { ...alert, acknowledged: true } : alert,
            ),
          })),

        acknowledgeAll: () =>
          set((state) => ({
            alerts: state.alerts.map((alert) => ({ ...alert, acknowledged: true })),
          })),

        clearNotice: () => set({ notice: null }),

        resetDemo: () => simulatedEdgeDataSource.reset(),
      };
    },
    {
      name: 'ecosort-state-v1',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: (state) => ({
        station: state.station,
        bins: state.bins,
        events: state.events,
        alerts: state.alerts,
      }),
    },
  ),
);

export function useAttentionCount(): number {
  return useEcoStore(
    (state) =>
      state.bins.filter((bin) => bin.status !== 'normal').length,
  );
}

export function describeAlert(alert: BinAlert): string {
  return alert.type === 'offline'
    ? 'Sensor Offline'
    : getStatusLabel(alert.type);
}
