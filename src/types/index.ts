export type BinCategory = 'plastic' | 'metal' | 'general';

export type BinStatus = 'normal' | 'almost_full' | 'full' | 'offline';

export type AlertType = Exclude<BinStatus, 'normal'>;

export interface SmartBin {
  id: string;
  category: BinCategory;
  name: string;
  fillPercent: number;
  distanceCm: number;
  emptyDepthCm: number;
  status: BinStatus;
  lastUpdated: string;
  lastEmptied: string;
  itemCountToday: number;
}

export interface DisposalEvent {
  id: string;
  detectedObject: string;
  category: BinCategory;
  confidence?: number;
  timestamp: string;
  kind?: 'disposal' | 'maintenance';
}

export interface BinAlert {
  id: string;
  binId: string;
  type: AlertType;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export type EdgeUpdate =
  | { type: 'bin_updated'; bin: SmartBin }
  | { type: 'event_added'; event: DisposalEvent; bin?: SmartBin }
  | { type: 'reset'; bins: SmartBin[]; events: DisposalEvent[] }
  | { type: 'connection_changed'; online: boolean };

export interface DetectionNotice {
  id: string;
  title: string;
  message: string;
}
