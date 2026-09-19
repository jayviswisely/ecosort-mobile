import { createInitialBins, createInitialEvents } from '@/data/initialData';
import type { EdgeDataSource } from '@/services/edge/EdgeDataSource';
import type { BinCategory, DisposalEvent, EdgeUpdate, FillState, SmartBin } from '@/types';
import { distanceForFill, getFillProgress } from '@/utils/bin';

type Listener = (update: EdgeUpdate) => void;

interface SimulatedObject {
  category: BinCategory;
  confidence: number;
  fillIncrement: number;
}

const simulatedObjects: Record<string, SimulatedObject> = {
  'PET Bottle': { category: 'plastic', confidence: 0.94, fillIncrement: 2 },
  'Aluminum Can': { category: 'metal', confidence: 0.97, fillIncrement: 2 },
  Tissue: { category: 'general', confidence: 0.91, fillIncrement: 1 },
  'Snack Wrapper': { category: 'general', confidence: 0.89, fillIncrement: 2 },
};

export class SimulatedEdgeDataSource implements EdgeDataSource {
  private bins = createInitialBins();
  private events = createInitialEvents();
  private listeners = new Set<Listener>();

  async getBins(): Promise<SmartBin[]> {
    return this.bins.map((bin) => ({ ...bin }));
  }

  async getRecentEvents(): Promise<DisposalEvent[]> {
    return this.events.map((event) => ({ ...event }));
  }

  subscribeToUpdates(callback: Listener): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /** Synchronizes the simulator with locally persisted app state. */
  seed(bins: SmartBin[], events: DisposalEvent[]): void {
    if (bins.length > 0) this.bins = bins.map((bin) => ({ ...bin }));
    if (events.length > 0) this.events = events.map((event) => ({ ...event }));
  }

  setFillLevel(category: BinCategory, fillState: FillState): void {
    const existing = this.findBin(category);
    const bin: SmartBin = {
      ...existing,
      distanceCm: distanceForFill(existing.emptyDepthCm, getFillProgress(fillState)),
      status: fillState,
      fillSource: 'simulator',
      fillConfidence: null,
      lastUpdated: new Date().toISOString(),
    };

    this.replaceBin(bin);
    this.emit({ type: 'bin_updated', bin: { ...bin } });
  }

  simulateDisposal(detectedObject: keyof typeof simulatedObjects): void {
    const configuration = simulatedObjects[detectedObject];
    const existing = this.findBin(configuration.category);
    const timestamp = new Date().toISOString();
    const event: DisposalEvent = {
      id: `event-${Date.now()}`,
      detectedObject,
      category: configuration.category,
      confidence: configuration.confidence,
      timestamp,
      kind: 'disposal',
    };
    const bin: SmartBin = {
      ...existing,
      status: existing.status === 'empty' || existing.status === 'offline' ? 'half-full' : existing.status,
      distanceCm: distanceForFill(
        existing.emptyDepthCm,
        getFillProgress(existing.status === 'empty' || existing.status === 'offline' ? 'half-full' : existing.status),
      ),
      fillSource: 'simulator',
      fillConfidence: null,
      lastUpdated: timestamp,
      itemCountToday: existing.itemCountToday + 1,
    };

    this.events = [event, ...this.events].slice(0, 50);
    this.replaceBin(bin);
    this.emit({
      type: 'event_added',
      event: { ...event },
      bin: { ...bin },
    });
  }

  setSensorOffline(category: BinCategory): void {
    const existing = this.findBin(category);
    const bin: SmartBin = {
      ...existing,
      status: 'offline',
      lastUpdated: new Date(Date.now() - 15 * 60_000).toISOString(),
    };

    this.replaceBin(bin);
    this.emit({ type: 'bin_updated', bin: { ...bin } });
  }

  markEmptied(category: BinCategory): void {
    const existing = this.findBin(category);
    const timestamp = new Date().toISOString();
    const bin: SmartBin = {
      ...existing,
      distanceCm: existing.emptyDepthCm,
      status: 'empty',
      fillSource: 'manual',
      fillConfidence: null,
      lastUpdated: timestamp,
      lastEmptied: timestamp,
    };
    const event: DisposalEvent = {
      id: `event-empty-${Date.now()}`,
      detectedObject: 'Bin emptied by staff',
      category,
      timestamp,
      kind: 'maintenance',
    };

    this.events = [event, ...this.events].slice(0, 50);
    this.replaceBin(bin);
    this.emit({ type: 'event_added', event, bin });
  }

  reset(): void {
    this.bins = createInitialBins();
    this.events = createInitialEvents();
    this.emit({
      type: 'reset',
      bins: this.bins.map((bin) => ({ ...bin })),
      events: this.events.map((event) => ({ ...event })),
    });
  }

  private findBin(category: BinCategory): SmartBin {
    const bin = this.bins.find((item) => item.category === category);
    if (!bin) throw new Error(`Unknown bin category: ${category}`);
    return bin;
  }

  private replaceBin(bin: SmartBin): void {
    this.bins = this.bins.map((item) => (item.id === bin.id ? bin : item));
  }

  private emit(update: EdgeUpdate): void {
    this.listeners.forEach((listener) => listener(update));
  }
}

export const simulatedEdgeDataSource = new SimulatedEdgeDataSource();
