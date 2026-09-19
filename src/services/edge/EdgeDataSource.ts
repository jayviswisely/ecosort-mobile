import type { BinCategory, DisposalEvent, EdgeUpdate, SmartBin } from '@/types';

/** Read-only contract implemented by any FRDM-i.MX93 transport. */
export interface EdgeDataSource {
  getBins(): Promise<SmartBin[]>;
  getRecentEvents(): Promise<DisposalEvent[]>;
  subscribeToUpdates(callback: (update: EdgeUpdate) => void): () => void;
  markEmptied?(category: BinCategory): Promise<void> | void;
}
