import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ActivityItem,
  BinCard,
  DemoControlPanel,
  EdgeSystemCard,
  SystemStatus,
} from '@/components';
import { useAttentionCount, useEcoStore } from '@/store/useEcoStore';
import { colors, radii } from '@/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const [demoVisible, setDemoVisible] = useState(false);
  const station = useEcoStore((state) => state.station);
  const edgeMode = useEcoStore((state) => state.edgeMode);
  const edgeConnected = useEcoStore((state) => state.edgeConnected);
  const bins = useEcoStore((state) => state.bins);
  const events = useEcoStore((state) => state.events);
  const attentionCount = useAttentionCount();
  const liveMode = edgeMode === 'live';
  const sensorCount = bins.filter((bin) => bin.status !== 'offline').length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Ionicons name="leaf" size={22} color={colors.white} />
            </View>
            <View>
              <Text style={styles.appName}>EcoSort</Text>
              <Text style={styles.subtitle}>Smart Waste Management</Text>
            </View>
          </View>
          {!liveMode && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open demo controls"
              onPress={() => setDemoVisible(true)}
              style={({ pressed }) => [styles.demoButton, pressed && styles.pressed]}
            >
              <Ionicons name="options-outline" size={19} color={colors.primary} />
              <Text style={styles.demoButtonText}>Demo</Text>
            </Pressable>
          )}
        </View>

        <SystemStatus station={station} online={edgeConnected} />

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Bin status</Text>
            <Text style={styles.sectionSubtitle}>
              {liveMode ? 'Live depth-sensor readings' : 'Simulated sensor readings'}
            </Text>
          </View>
          <View
            style={[
              styles.liveBadge,
              !edgeConnected && { backgroundColor: colors.dangerSoft },
            ]}
          >
            <View
              style={[
                styles.liveDot,
                !edgeConnected && { backgroundColor: colors.danger },
              ]}
            />
            <Text
              style={[
                styles.liveText,
                !edgeConnected && { color: colors.danger },
              ]}
            >
              {edgeConnected ? (liveMode ? 'LIVE' : 'DEMO') : 'OFFLINE'}
            </Text>
          </View>
        </View>

        <View style={styles.binStack}>
          {bins.map((bin) => (
            <BinCard
              key={bin.id}
              bin={bin}
              onPress={() => router.push(`/bin/${bin.id}` as Href)}
            />
          ))}
        </View>

        <View style={styles.overviewCard}>
          <OverviewMetric
            value={String(liveMode ? sensorCount : bins.length)}
            label="Bins monitored"
          />
          <View style={styles.overviewDivider} />
          <OverviewMetric
            value={String(attentionCount)}
            label="Need attention"
            color={attentionCount > 0 ? colors.warning : colors.normal}
          />
          <View style={styles.overviewDivider} />
          <OverviewMetric
            value={edgeConnected ? 'Online' : 'Issue'}
            label="System status"
            color={edgeConnected ? colors.normal : colors.danger}
            compact
          />
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <Text style={styles.sectionSubtitle}>Latest AI classifications</Text>
          </View>
          <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.activityCard}>
          {events.slice(0, 5).map((event, index, visibleEvents) => (
            <ActivityItem
              key={event.id}
              event={event}
              isLast={index === visibleEvents.length - 1}
            />
          ))}
        </View>

        <View style={styles.edgeSpacing}>
          <EdgeSystemCard
            connected={edgeConnected}
            live={liveMode}
            sensorCount={sensorCount}
          />
        </View>
      </ScrollView>

      <DemoControlPanel
        visible={demoVisible}
        onClose={() => setDemoVisible(false)}
      />
    </SafeAreaView>
  );
}

function OverviewMetric({
  value,
  label,
  color = colors.text,
  compact = false,
}: {
  value: string;
  label: string;
  color?: string;
  compact?: boolean;
}) {
  return (
    <View style={styles.overviewMetric}>
      <Text style={[styles.overviewValue, compact && styles.compactValue, { color }]}>
        {value}
      </Text>
      <Text style={styles.overviewLabel}>{label}</Text>
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
    paddingTop: 12,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  appName: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 1,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
  demoButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.62,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 27,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.normalSoft,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.normal,
  },
  liveText: {
    color: colors.normal,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  binStack: {
    gap: 12,
  },
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 13,
    paddingVertical: 15,
    borderRadius: radii.medium,
    backgroundColor: colors.surfaceSoft,
  },
  overviewMetric: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  overviewValue: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900',
  },
  compactValue: {
    fontSize: 14,
    lineHeight: 24,
  },
  overviewLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
    marginTop: 2,
  },
  overviewDivider: {
    width: 1,
    backgroundColor: '#CFDDD3',
  },
  activityCard: {
    paddingHorizontal: 16,
    borderRadius: radii.large,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  edgeSpacing: {
    marginTop: 22,
  },
});
