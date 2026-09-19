import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import {
  AccessibilityInfo,
  AppState,
  type AppStateStatus,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  stopAlarmFeedback,
  triggerAlarmFeedback,
} from '@/services/alarm/alarmFeedback';
import {
  dismissFullBinNotificationAsync,
  showFullBinNotificationAsync,
} from '@/services/alarm/backgroundAlerts';
import { useEcoStore } from '@/store/useEcoStore';
import { colors, radii, shadows } from '@/theme';

/**
 * Interruptive alarm for unresolved full-bin alerts.
 * Acknowledging silences the alarm, while the bin remains visibly Full until
 * staff completes the collection and marks it as emptied.
 */
export function FullBinAlarm() {
  const router = useRouter();
  const alerts = useEcoStore((state) => state.alerts);
  const bins = useEcoStore((state) => state.bins);
  const acknowledgeAlert = useEcoStore((state) => state.acknowledgeAlert);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const previousAlertId = useRef<string | null>(null);

  const alert = useMemo(
    () =>
      alerts.find(
        (item) => item.type === 'full' && !item.acknowledged,
      ),
    [alerts],
  );
  const bin = useMemo(
    () => bins.find((item) => item.id === alert?.binId),
    [alert?.binId, bins],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const previous = previousAlertId.current;
    if (previous && previous !== alert?.id) {
      void dismissFullBinNotificationAsync(previous);
    }
    previousAlertId.current = alert?.id ?? null;
  }, [alert?.id]);

  useEffect(() => {
    if (!alert || !bin) return;

    if (appState !== 'active') {
      stopAlarmFeedback();
      void showFullBinNotificationAsync(alert.id, bin.name, bin.fillPercent);
      return;
    }

    void dismissFullBinNotificationAsync(alert.id);
    void triggerAlarmFeedback(bin.name, bin.fillPercent);
    try {
      AccessibilityInfo.announceForAccessibility(
        `Urgent EcoSort alarm. ${bin.name} is ${bin.fillPercent} percent full and needs collection.`,
      );
    } catch (error) {
      console.warn('Unable to announce the EcoSort alarm.', error);
    }

    return stopAlarmFeedback;
  }, [alert?.id, appState, bin?.fillPercent, bin?.name]);

  if (!alert || !bin) return null;

  const acknowledge = () => {
    stopAlarmFeedback();
    void dismissFullBinNotificationAsync(alert.id);
    acknowledgeAlert(alert.id);
  };
  const openResponse = () => {
    acknowledge();
    router.push(`/bin/${bin.id}` as Href);
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => undefined}
    >
      <SafeAreaView style={styles.backdrop} edges={['top', 'bottom']}>
        <View style={styles.card}>
          <View style={styles.alarmIcon}>
            <Ionicons name="warning" size={31} color={colors.white} />
          </View>

          <View style={styles.urgentBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.urgentText}>COLLECTION REQUIRED</Text>
          </View>

          <Text style={styles.title}>{bin.name} is full</Text>
          <Text style={styles.percent}>{bin.fillPercent}% capacity</Text>
          <Text style={styles.description}>
            This bin needs immediate attention. Acknowledge the alarm, collect
            the waste, then mark the bin as emptied.
          </Text>

          <View style={styles.stepsCard}>
            <ResponseStep number="1" text="Go to the EcoSort station" />
            <ResponseStep number="2" text="Remove the waste and replace the liner" />
            <ResponseStep number="3" text="Open bin details and tap Mark as Emptied" isLast />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={openResponse}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Ionicons name="navigate-outline" size={20} color={colors.white} />
            <Text style={styles.primaryButtonText}>Acknowledge & Open Bin</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={acknowledge}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Ionicons name="volume-mute-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.secondaryButtonText}>Acknowledge alarm</Text>
          </Pressable>

          <Text style={styles.footerNote}>
            Acknowledging silences this alarm. The bin stays marked Full until it is emptied.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function ResponseStep({
  number,
  text,
  isLast = false,
}: {
  number: string;
  text: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.step, !isLast && styles.stepBorder]}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(10, 20, 14, 0.72)',
  },
  card: {
    width: '100%',
    maxWidth: 430,
    alignItems: 'center',
    padding: 24,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: '#E9B8B8',
    ...shadows.card,
  },
  alarmIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.danger,
    marginBottom: 15,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.dangerSoft,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  urgentText: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.7,
    textAlign: 'center',
    marginTop: 13,
  },
  percent: {
    color: colors.danger,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  stepsCard: {
    width: '100%',
    marginTop: 19,
    paddingHorizontal: 14,
    borderRadius: radii.medium,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stepBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  stepNumber: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: colors.dangerSoft,
    marginRight: 10,
  },
  stepNumberText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '900',
  },
  stepText: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radii.medium,
    backgroundColor: colors.danger,
    marginTop: 20,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 16,
    marginTop: 5,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  footerNote: {
    maxWidth: 330,
    color: colors.textTertiary,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.62,
  },
});
