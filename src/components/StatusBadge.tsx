import { StyleSheet, Text, View } from 'react-native';

import type { BinStatus } from '@/types';
import { getStatusColor, getStatusLabel, getStatusSoftColor } from '@/utils/bin';

interface StatusBadgeProps {
  status: BinStatus;
  compact?: boolean;
}

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const color = getStatusColor(status);

  return (
    <View
      style={[
        styles.badge,
        compact && styles.compact,
        { backgroundColor: getStatusSoftColor(status) },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, compact && styles.compactLabel, { color }]}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },
  compact: {
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  compactLabel: {
    fontSize: 12,
  },
});
