import { colors } from '@/theme';
import type { BinCategory, BinStatus, FillState } from '@/types';

export function calculateFillPercentage(
  emptyDepthCm: number,
  currentDistanceCm: number,
): number {
  if (!Number.isFinite(emptyDepthCm) || emptyDepthCm <= 0) return 0;
  if (!Number.isFinite(currentDistanceCm)) return 0;

  const raw = ((emptyDepthCm - currentDistanceCm) / emptyDepthCm) * 100;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export function getStatus(fillPercent: number, online = true): BinStatus {
  if (!online) return 'offline';
  if (fillPercent >= 75) return 'full';
  if (fillPercent <= 5) return 'empty';
  return 'half-full';
}

export function getFillProgress(status: BinStatus): number {
  return {
    empty: 0,
    'half-full': 50,
    full: 100,
    offline: 0,
  }[status];
}

export function isFillState(value: unknown): value is FillState {
  return value === 'empty' || value === 'half-full' || value === 'full';
}

export function getStatusLabel(status: BinStatus): string {
  return {
    empty: 'Empty',
    'half-full': 'Half-full',
    full: 'Full',
    offline: 'Sensor Offline',
  }[status];
}

export function getStatusColor(status: BinStatus): string {
  return {
    empty: colors.normal,
    'half-full': colors.warning,
    full: colors.danger,
    offline: colors.offline,
  }[status];
}

export function getStatusSoftColor(status: BinStatus): string {
  return {
    empty: colors.normalSoft,
    'half-full': colors.warningSoft,
    full: colors.dangerSoft,
    offline: colors.offlineSoft,
  }[status];
}

export function getCategoryColor(category: BinCategory): string {
  return {
    plastic: '#2775B6',
    metal: '#6D7885',
    general: '#526359',
  }[category];
}

export function getCategorySoftColor(category: BinCategory): string {
  return {
    plastic: '#E5F1FA',
    metal: '#EDF0F3',
    general: '#EAF0EC',
  }[category];
}

export function getCategoryIcon(
  category: BinCategory,
): 'water-outline' | 'construct-outline' | 'trash-outline' {
  const icons = {
    plastic: 'water-outline',
    metal: 'construct-outline',
    general: 'trash-outline',
  } as const;

  return icons[category];
}

export function distanceForFill(emptyDepthCm: number, fillPercent: number): number {
  const clamped = Math.min(100, Math.max(0, fillPercent));
  return Number((emptyDepthCm * (1 - clamped / 100)).toFixed(1));
}
