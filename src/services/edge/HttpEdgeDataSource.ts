import type { EdgeDataSource } from '@/services/edge/EdgeDataSource';
import type { DisposalEvent, EdgeUpdate, SmartBin } from '@/types';

/**
 * Future REST adapter for the FRDM-i.MX93 gateway.
 *
 * Intended contract:
 *   GET /api/status -> { device, online, timestamp }
 *   GET /api/bins   -> { bins: [{ id, distance_cm, empty_depth_cm,
 *                         fill_percent, sensor_online }] }
 *   GET /api/events -> { events: [{ object, category, confidence, timestamp }] }
 *
 * subscribeToUpdates can initially poll these endpoints and later be replaced by
 * server-sent events or WebSocket updates without affecting the UI.
 */
export class HttpEdgeDataSource implements EdgeDataSource {
  constructor(private readonly baseUrl: string) {}

  async getBins(): Promise<SmartBin[]> {
    void this.baseUrl;
    throw new Error('HttpEdgeDataSource.getBins is not connected yet.');
  }

  async getRecentEvents(): Promise<DisposalEvent[]> {
    void this.baseUrl;
    throw new Error('HttpEdgeDataSource.getRecentEvents is not connected yet.');
  }

  subscribeToUpdates(_callback: (update: EdgeUpdate) => void): () => void {
    // TODO: poll GET /api/status, /api/bins, and /api/events or connect a stream.
    return () => undefined;
  }
}
