import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertCard } from '@/components';
import { useEcoStore } from '@/store/useEcoStore';
import { colors } from '@/theme';

export default function AlertsScreen() {
  const alerts = useEcoStore((state) => state.alerts);
  const bins = useEcoStore((state) => state.bins);
  const acknowledgeAlert = useEcoStore((state) => state.acknowledgeAlert);
  const acknowledgeAll = useEcoStore((state) => state.acknowledgeAll);
  const unacknowledged = alerts.filter((alert) => !alert.acknowledged).length;
  const sortedAlerts = [...alerts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>FACILITY MONITORING</Text>
            <Text style={styles.title}>Alerts</Text>
            <Text style={styles.subtitle}>
              {unacknowledged === 0
                ? 'Everything is acknowledged'
                : `${unacknowledged} item${unacknowledged === 1 ? '' : 's'} need attention`}
            </Text>
          </View>
          <View style={styles.bellWrap}>
            <Ionicons name="notifications-outline" size={23} color={colors.primary} />
            {unacknowledged > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{unacknowledged}</Text>
              </View>
            )}
          </View>
        </View>

        {unacknowledged > 0 && alerts.length > 1 && (
          <Pressable
            accessibilityRole="button"
            onPress={acknowledgeAll}
            style={({ pressed }) => [styles.ackAll, pressed && styles.pressed]}
          >
            <Ionicons name="checkmark-done-outline" size={18} color={colors.primary} />
            <Text style={styles.ackAllText}>Acknowledge all</Text>
          </Pressable>
        )}

        {sortedAlerts.length > 0 ? (
          <View style={styles.alertStack}>
            {sortedAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                bin={bins.find((bin) => bin.id === alert.binId)}
                onAcknowledge={() => acknowledgeAlert(alert.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle-outline" size={35} color={colors.normal} />
            </View>
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptyText}>
              New capacity and sensor alerts will appear here automatically.
            </Text>
          </View>
        )}

        <View style={styles.thresholdCard}>
          <View style={styles.thresholdHeading}>
            <Ionicons name="analytics-outline" size={19} color={colors.primary} />
            <Text style={styles.thresholdTitle}>Alert thresholds</Text>
          </View>
          <ThresholdRow color={colors.normal} label="Normal" range="0–74%" />
          <ThresholdRow color={colors.warning} label="Almost Full" range="75–89%" />
          <ThresholdRow color={colors.danger} label="Full" range="90–100%" isLast />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ThresholdRow({
  color,
  label,
  range,
  isLast = false,
}: {
  color: string;
  label: string;
  range: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.thresholdRow, !isLast && styles.thresholdBorder]}>
      <View style={[styles.thresholdDot, { backgroundColor: color }]} />
      <Text style={styles.thresholdLabel}>{label}</Text>
      <Text style={styles.thresholdRange}>{range}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  bellWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countBadge: {
    position: 'absolute',
    top: 7,
    right: 6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  countText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '900',
  },
  ackAll: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
    marginBottom: 12,
    padding: 6,
  },
  ackAllText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  alertStack: {
    gap: 11,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 28,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.normalSoft,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 14,
  },
  emptyText: {
    maxWidth: 300,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 5,
  },
  thresholdCard: {
    padding: 17,
    marginTop: 22,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thresholdHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  thresholdTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },
  thresholdBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  thresholdDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 9,
  },
  thresholdLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  thresholdRange: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.55,
  },
});
