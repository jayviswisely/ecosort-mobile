import { useEffect, useMemo, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityItem, StatusBadge } from '@/components';
import { useEcoStore } from '@/store/useEcoStore';
import { colors, radii, shadows } from '@/theme';
import type { BinCategory, SmartBin } from '@/types';
import {
  getCategoryColor,
  getCategoryIcon,
  getCategorySoftColor,
  getFillProgress,
  getStatusColor,
  getStatusLabel,
} from '@/utils/bin';
import { friendlyDateTime, relativeTime } from '@/utils/date';

const validCategories: BinCategory[] = ['plastic', 'metal', 'general'];

export default function BinDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const category = validCategories.includes(id as BinCategory)
    ? (id as BinCategory)
    : undefined;
  const bin = useEcoStore((state) =>
    state.bins.find((item) => item.category === category),
  );
  const allEvents = useEcoStore((state) => state.events);
  const events = useMemo(
    () =>
      allEvents
        .filter((event) => event.category === category)
        .slice(0, 5),
    [allEvents, category],
  );
  const markEmptied = useEcoStore((state) => state.markEmptied);

  if (!bin || !category) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Ionicons name="trash-outline" size={34} color={colors.textTertiary} />
          <Text style={styles.notFoundTitle}>Bin not found</Text>
          <Pressable onPress={() => router.back()} style={styles.backTextButton}>
            <Text style={styles.backText}>Return to dashboard</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerEyebrow}>BIN DETAILS</Text>
            <Text style={styles.headerTitle}>{bin.name}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroVisual}>
            <VerticalFill bin={bin} />
          </View>
          <View style={styles.heroContent}>
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: getCategorySoftColor(bin.category) },
              ]}
            >
              <Ionicons
                name={getCategoryIcon(bin.category)}
                size={23}
                color={getCategoryColor(bin.category)}
              />
            </View>
            <Text style={styles.heroLabel}>CURRENT FILL</Text>
            <Text style={styles.heroState}>{getStatusLabel(bin.status)}</Text>
            <StatusBadge status={bin.status} />
            <Text style={styles.heroUpdated}>Updated {relativeTime(bin.lastUpdated).toLowerCase()}</Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Fill monitoring</Text>
          <View style={styles.sensorOnline}>
            <View
              style={[
                styles.sensorDot,
                { backgroundColor: bin.status === 'offline' ? colors.danger : colors.normal },
              ]}
            />
            <Text style={styles.sensorOnlineText}>
              {bin.status === 'offline' ? 'Offline' : 'Online'}
            </Text>
          </View>
        </View>
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="resize-outline"
            label="Detection source"
            value={bin.fillSource ? bin.fillSource.replace(/_/g, ' ') : 'Unavailable'}
          />
          <MetricCard
            icon="scan-outline"
            label="Fill state"
            value={getStatusLabel(bin.status)}
          />
          <MetricCard
            icon="analytics-outline"
            label="Confidence"
            value={confidenceLabel(bin.fillConfidence)}
          />
          <MetricCard
            icon="cube-outline"
            label="Items today"
            value={String(bin.itemCountToday)}
          />
        </View>

        <View style={styles.lastEmptiedCard}>
          <View style={styles.lastEmptiedIcon}>
            <Ionicons name="time-outline" size={21} color={colors.primary} />
          </View>
          <View style={styles.lastEmptiedContent}>
            <Text style={styles.lastEmptiedLabel}>LAST EMPTIED</Text>
            <Text style={styles.lastEmptiedValue}>{friendlyDateTime(bin.lastEmptied)}</Text>
          </View>
          <Ionicons name="checkmark-circle" size={21} color={colors.normal} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => markEmptied(category)}
          style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
        >
          <Ionicons name="checkmark-done-outline" size={20} color={colors.white} />
          <Text style={styles.emptyButtonText}>Mark as Emptied</Text>
        </Pressable>
        <Text style={styles.emptyHint}>Use after staff physically empty this bin.</Text>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <Text style={styles.activityCount}>{events.length} latest</Text>
        </View>
        <View style={styles.activityCard}>
          {events.map((event, index) => (
            <ActivityItem
              key={event.id}
              event={event}
              isLast={index === events.length - 1}
            />
          ))}
          {events.length === 0 && (
            <Text style={styles.noActivity}>No activity for this bin yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function VerticalFill({ bin }: { bin: SmartBin }) {
  const target = getFillProgress(bin.status);
  const animated = useRef(new Animated.Value(target)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: target,
      duration: 550,
      useNativeDriver: false,
    }).start();
  }, [animated, target]);

  const height = animated.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.tankOuter}>
      <View style={styles.tankInner}>
        <Animated.View
          style={[
            styles.tankFill,
            { height, backgroundColor: getStatusColor(bin.status) },
          ]}
        />
        {[25, 50, 75].map((mark) => (
          <View key={mark} style={[styles.tankMark, { bottom: `${mark}%` }]} />
        ))}
      </View>
      <View style={styles.tankTop} />
    </View>
  );
}

function confidenceLabel(confidence: number | null): string {
  if (confidence === null) return 'Not reported';
  if (confidence >= 0.85) return 'High';
  if (confidence >= 0.65) return 'Medium';
  return 'Low';
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: 'resize-outline' | 'scan-outline' | 'analytics-outline' | 'cube-outline';
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
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
    paddingTop: 10,
    paddingBottom: 38,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerEyebrow: {
    color: colors.textTertiary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 42,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 22,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  heroVisual: {
    width: '44%',
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroLabel: {
    color: colors.textTertiary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  heroPercentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroPercent: {
    color: colors.text,
    fontSize: 54,
    lineHeight: 60,
    fontWeight: '900',
    letterSpacing: -2.5,
  },
  heroPercentSymbol: {
    color: colors.textSecondary,
    fontSize: 21,
    lineHeight: 30,
    fontWeight: '800',
    marginTop: 6,
    marginLeft: 2,
  },
  heroState: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '900',
    letterSpacing: -1.2,
    marginVertical: 3,
  },
  heroUpdated: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 10,
  },
  tankOuter: {
    width: 94,
    height: 178,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tankInner: {
    width: 78,
    height: 160,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#CBD7CE',
    backgroundColor: colors.background,
  },
  tankFill: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    opacity: 0.9,
  },
  tankMark: {
    position: 'absolute',
    right: 6,
    width: 12,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  tankTop: {
    position: 'absolute',
    top: 7,
    width: 94,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9AA89E',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 11,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
  },
  sensorOnline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sensorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  sensorOnlineText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: 135,
    padding: 15,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 9,
  },
  metricValue: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    marginTop: 2,
  },
  lastEmptiedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginTop: 12,
    borderRadius: radii.medium,
    backgroundColor: colors.surfaceSoft,
  },
  lastEmptiedIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginRight: 11,
  },
  lastEmptiedContent: {
    flex: 1,
  },
  lastEmptiedLabel: {
    color: colors.textTertiary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  lastEmptiedValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    marginTop: 20,
    borderRadius: radii.medium,
    backgroundColor: colors.primary,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyHint: {
    color: colors.textTertiary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 7,
  },
  activityCount: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  activityCard: {
    paddingHorizontal: 16,
    borderRadius: radii.large,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noActivity: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  notFoundTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 10,
  },
  backTextButton: {
    padding: 12,
    marginTop: 8,
  },
  backText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.6,
  },
});
