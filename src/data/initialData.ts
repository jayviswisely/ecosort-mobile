import type { BinAlert, DisposalEvent, SmartBin } from '@/types';
import { distanceForFill, getStatus } from '@/utils/bin';

const isoMinutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

const isoHoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3_600_000).toISOString();

export function createInitialBins(): SmartBin[] {
  const base = [
    { id: 'plastic', category: 'plastic' as const, name: 'Plastic Bin', fill: 82, count: 37 },
    { id: 'metal', category: 'metal' as const, name: 'Metal Bin', fill: 41, count: 18 },
    { id: 'general', category: 'general' as const, name: 'General Bin', fill: 63, count: 29 },
  ];

  return base.map(({ id, category, name, fill, count }, index) => ({
    id,
    category,
    name,
    fillPercent: fill,
    distanceCm: distanceForFill(40, fill),
    emptyDepthCm: 40,
    status: getStatus(fill),
    lastUpdated: new Date(Date.now() - (8 + index * 4) * 1_000).toISOString(),
    lastEmptied: isoHoursAgo(5 + index * 2),
    itemCountToday: count,
  }));
}

export function createInitialEvents(): DisposalEvent[] {
  return [
    {
      id: 'event-pet-bottle',
      detectedObject: 'PET Bottle',
      category: 'plastic',
      confidence: 0.94,
      timestamp: isoMinutesAgo(2),
      kind: 'disposal',
    },
    {
      id: 'event-aluminum-can',
      detectedObject: 'Aluminum Can',
      category: 'metal',
      confidence: 0.97,
      timestamp: isoMinutesAgo(4),
      kind: 'disposal',
    },
    {
      id: 'event-tissue',
      detectedObject: 'Tissue',
      category: 'general',
      confidence: 0.91,
      timestamp: isoMinutesAgo(9),
      kind: 'disposal',
    },
  ];
}

export function createInitialAlerts(): BinAlert[] {
  return [
    {
      id: 'alert-plastic-almost-full',
      binId: 'plastic',
      type: 'almost_full',
      message: 'Plastic Bin has reached 82% capacity.',
      timestamp: isoMinutesAgo(2),
      acknowledged: false,
    },
  ];
}
