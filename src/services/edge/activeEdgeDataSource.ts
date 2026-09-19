import type { EdgeDataSource } from './EdgeDataSource';
import { HttpEdgeDataSource } from './HttpEdgeDataSource';
import { simulatedEdgeDataSource } from './SimulatedEdgeDataSource';

export const edgeMode =
  process.env.EXPO_PUBLIC_EDGE_MODE?.trim().toLowerCase() === 'live'
    ? 'live'
    : 'demo';

const configuredUrl = process.env.EXPO_PUBLIC_EDGE_URL?.trim();

if (edgeMode === 'live' && !configuredUrl) {
  throw new Error(
    'EXPO_PUBLIC_EDGE_URL is required when EXPO_PUBLIC_EDGE_MODE=live.',
  );
}

export const edgeDataSource: EdgeDataSource =
  edgeMode === 'live'
    ? new HttpEdgeDataSource(configuredUrl as string)
    : simulatedEdgeDataSource;
