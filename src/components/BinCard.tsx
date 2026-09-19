import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FillIndicator } from '@/components/FillIndicator';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, radii, shadows } from '@/theme';
import type { SmartBin } from '@/types';
import {
  getCategoryColor,
  getCategoryIcon,
  getCategorySoftColor,
  getStatusLabel,
} from '@/utils/bin';
import { relativeTime } from '@/utils/date';

interface BinCardProps {
  bin: SmartBin;
  onPress: () => void;
}

export function BinCard({ bin, onPress }: BinCardProps) {
  const categoryColor = getCategoryColor(bin.category);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${bin.name}, ${getStatusLabel(bin.status)}, open details`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.categoryRow}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: getCategorySoftColor(bin.category) },
            ]}
          >
            <Ionicons
              name={getCategoryIcon(bin.category)}
              size={22}
              color={categoryColor}
            />
          </View>
          <View>
            <Text style={styles.eyebrow}>{bin.category.toUpperCase()}</Text>
            <Text style={styles.cardName}>{bin.name}</Text>
          </View>
        </View>
        <View style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
      </View>

      <View style={styles.metricRow}>
        <Text style={styles.stateLabel}>{getStatusLabel(bin.status)}</Text>
        <StatusBadge status={bin.status} compact />
      </View>

      <FillIndicator status={bin.status} />

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Camera fill state</Text>
        <View style={styles.updatedRow}>
          <Ionicons name="radio-outline" size={13} color={colors.textTertiary} />
          <Text style={styles.updatedText}>Updated {relativeTime(bin.lastUpdated).toLowerCase()}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: radii.large,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: colors.textTertiary,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  cardName: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    marginTop: 1,
  },
  arrowButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 12,
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  percent: {
    color: colors.text,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -1.7,
  },
  percentSymbol: {
    color: colors.textSecondary,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
    marginTop: 4,
    marginLeft: 2,
  },
  stateLabel: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 9,
  },
  footerLabel: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  updatedText: {
    color: colors.textTertiary,
    fontSize: 12,
  },
});
