import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/theme';
import type { BinAlert, SmartBin } from '@/types';
import { getStatusColor, getStatusSoftColor } from '@/utils/bin';
import { relativeTime } from '@/utils/date';

interface AlertCardProps {
  alert: BinAlert;
  bin?: SmartBin;
  onAcknowledge: () => void;
}

export function AlertCard({ alert, bin, onAcknowledge }: AlertCardProps) {
  const color = getStatusColor(alert.type);
  const title = alert.type === 'offline' ? 'Sensor Offline' : alert.type === 'full' ? 'Bin Full' : 'Almost Full';

  return (
    <View
      style={[
        styles.card,
        alert.acknowledged && styles.acknowledgedCard,
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: getStatusSoftColor(alert.type) }]}>
          <Ionicons
            name={alert.type === 'offline' ? 'cloud-offline-outline' : 'warning-outline'}
            size={21}
            color={color}
          />
        </View>
        <View style={styles.heading}>
          <Text style={[styles.alertType, { color }]}>{title.toUpperCase()}</Text>
          <Text style={styles.binName}>{bin?.name ?? `${alert.binId} bin`}</Text>
        </View>
        {alert.acknowledged ? (
          <View style={styles.ackBadge}>
            <Ionicons name="checkmark" size={13} color={colors.textSecondary} />
            <Text style={styles.ackBadgeText}>Acknowledged</Text>
          </View>
        ) : (
          <View style={[styles.liveDot, { backgroundColor: color }]} />
        )}
      </View>

      <Text style={styles.message}>{alert.message}</Text>

      <View style={styles.footer}>
        <Text style={styles.time}>{relativeTime(alert.timestamp)}</Text>
        {!alert.acknowledged && (
          <Pressable
            accessibilityRole="button"
            onPress={onAcknowledge}
            style={({ pressed }) => [styles.ackButton, pressed && styles.pressed]}
          >
            <Ionicons name="checkmark-circle-outline" size={17} color={colors.primary} />
            <Text style={styles.ackButtonText}>Acknowledge</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 17,
    borderRadius: radii.large,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  acknowledgedCard: {
    opacity: 0.72,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  heading: {
    flex: 1,
  },
  alertType: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  binName: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    marginTop: 1,
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 3,
  },
  ackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ackBadgeText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  time: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  ackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 9,
    marginVertical: -6,
    marginRight: -4,
  },
  ackButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.55,
  },
});
