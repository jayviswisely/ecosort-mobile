import { colors } from '@/theme';
import type { BinCategory, BinStatus } from '@/types';

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
  if (fillPercent >= 90) return 'full';
  if (fillPercent >= 75) return 'almost_full';
  return 'normal';
}

export function getStatusLabel(status: BinStatus): string {
  return {
    normal: 'Normal',
    almost_full: 'Almost Full',
    full: 'Full',
    offline: 'Sensor Offline',
  }[status];
}

export function getStatusColor(status: BinStatus): string {
  return {
    normal: colors.normal,
    almost_full: colors.warning,
    full: colors.danger,
    offline: colors.offline,
  }[status];
}

export function getStatusSoftColor(status: BinStatus): string {
  return {
    normal: colors.normalSoft,
    almost_full: colors.warningSoft,
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
