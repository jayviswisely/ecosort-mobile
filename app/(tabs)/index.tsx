import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DecisionPipeline } from '@/components/autopilot/DecisionPipeline';
import HsinchuCityMap from '@/components/autopilot/HsinchuCityMap';
import type { MapRisk } from '@/components/autopilot/mapTypes';
import { AppText as Text } from '@/components/AppText';
import { AUTOPILOT_STATIONS, type AutopilotStation } from '@/data/autopilotData';
import {
  AUTOPILOT_ROUTE,
  AUTOPILOT_ROUTE_GROUPS,
  type ForecastWindow,
  useAutopilotStore,
} from '@/store/useAutopilotStore';
import { useEcoStore } from '@/store/useEcoStore';
import { colors, radii, shadows } from '@/theme';
import { getFillProgress } from '@/utils/bin';

type RiskLevel = MapRisk;

interface StationView extends AutopilotStation {
  currentFill: number;
  currentRisk: RiskLevel;
  currentEta: number | null;
}

const riskMeta: Record<
  RiskLevel,
  { label: string; color: string; soft: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  normal: {
    label: 'Normal',
    color: '#59CF8B',
    soft: '#153D2D',
    icon: 'checkmark-circle',
  },
  watch: {
    label: 'Filling fast',
    color: '#F5B84B',
    soft: '#47351A',
    icon: 'time',
  },
  critical: {
    label: 'Action needed',
    color: '#FF6B6B',
    soft: '#4A2023',
    icon: 'warning',
  },
  offline: {
    label: 'Sensor offline',
    color: '#9AA9A0',
    soft: '#29342E',
    icon: 'cloud-offline',
  },
  collected: {
    label: 'Collection verified',
    color: '#A7F36B',
    soft: '#1D4426',
    icon: 'checkmark-done-circle',
  },
};

export default function CommandScreen() {
  const bins = useEcoStore((state) => state.bins);
  const forecast = useAutopilotStore((state) => state.forecast);
  const selectedStationId = useAutopilotStore((state) => state.selectedStationId);
  const routeActive = useAutopilotStore((state) => state.routeActive);
  const completedStationIds = useAutopilotStore((state) => state.completedStationIds);
  const setForecast = useAutopilotStore((state) => state.setForecast);
  const selectStation = useAutopilotStore((state) => state.selectStation);
  const optimizeRoute = useAutopilotStore((state) => state.optimizeRoute);
  const completeNextStop = useAutopilotStore((state) => state.completeNextStop);
  const resetMission = useAutopilotStore((state) => state.resetMission);

  const edgeFill = bins.length > 0 ? Math.max(...bins.map((bin) => getFillProgress(bin.status))) : 50;
  const edgeOnline = bins.length > 0 && bins.every((bin) => bin.status !== 'offline');

  const stations = useMemo<StationView[]>(
    () =>
      AUTOPILOT_STATIONS.map((station) => {
        const completed = completedStationIds.includes(station.id);
        const online = station.edgeConnected ? edgeOnline : station.sensorOnline;
        const liveFill = station.edgeConnected ? edgeFill : station.fillPercent;
        const projectedFill = station.edgeConnected
          ? Math.min(100, liveFill + 14)
          : station.projectedFillPercent;
        const currentFill = completed
          ? 3
          : forecast === 'two_hours'
            ? projectedFill
            : liveFill;

        let currentRisk: RiskLevel = 'normal';
        if (completed) currentRisk = 'collected';
        else if (!online) currentRisk = 'offline';
        else if (currentFill >= 90) currentRisk = 'critical';
        else if (currentFill >= 75) currentRisk = 'watch';

        const estimatedEta = station.edgeConnected
          ? Math.max(8, Math.round((100 - liveFill) * 2.6))
          : station.predictedFullMinutes;

        return {
          ...station,
          sensorOnline: online,
          currentFill,
          currentRisk,
          currentEta: completed ? null : estimatedEta,
        };
      }),
    [completedStationIds, edgeFill, edgeOnline, forecast],
  );

  const selectedStation =
    stations.find((station) => station.id === selectedStationId) ?? stations[0];
  const criticalCount = stations.filter((station) => station.currentRisk === 'critical').length;
  const watchCount = stations.filter((station) => station.currentRisk === 'watch').length;
  const routeComplete = completedStationIds.length === AUTOPILOT_ROUTE.length;
  const nextStopId = AUTOPILOT_ROUTE.find((id) => !completedStationIds.includes(id));
  const nextStop = stations.find((station) => station.id === nextStopId);
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CommandHeader />

        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTopRow}>
            <View style={styles.autopilotBadge}>
              <Ionicons name="sparkles" size={13} color="#A7F36B" />
              <Text style={styles.autopilotBadgeText}>PREDICTIVE AUTOPILOT · DEMO</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>DEMO NETWORK</Text>
            </View>
          </View>

          <Text style={styles.heroNumber}>{criticalCount}</Text>
          <Text style={styles.heroTitle}>
            {criticalCount === 1 ? 'overflow risk detected' : 'overflow risks detected'}
          </Text>
          <Text style={styles.heroSubtitle}>
            EcoSort predicts capacity and dispatches collection before bins overflow.
          </Text>

          <View style={styles.heroMetrics}>
            <HeroMetric value={`${stations.length}`} label="Demo nodes" icon="radio-outline" />
            <View style={styles.heroDivider} />
            <HeroMetric value={`${watchCount}`} label="Fast filling" icon="trending-up-outline" />
            <View style={styles.heroDivider} />
            <HeroMetric value="98.4%" label="Edge uptime" icon="pulse-outline" />
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionEyebrow}>CITY DIGITAL TWIN</Text>
            <Text style={styles.sectionTitle}>Hsinchu command map</Text>
          </View>
          <ForecastSwitch value={forecast} onChange={setForecast} />
        </View>

        <View style={styles.mapCard}>
          <View style={styles.mapTopBar}>
            <View>
              <Text style={styles.mapKicker}>HSINCHU CITY · DEMO NETWORK</Text>
              <Text style={styles.mapTimestamp}>
                {forecast === 'now' ? 'Live sensor state' : 'AI capacity forecast · +2 hours'}
              </Text>
            </View>
            <View style={styles.mapCompass}>
              <Ionicons name="navigate" size={16} color="#A7F36B" />
            </View>
          </View>
          <HsinchuCityMap
            stations={stations}
            selectedStationId={selectedStationId}
            routeActive={routeActive}
            routeGroups={AUTOPILOT_ROUTE_GROUPS}
            onSelectStation={selectStation}
          />

          <View style={styles.mapLegend}>
            <LegendDot color={riskMeta.normal.color} label="Normal" />
            <LegendDot color={riskMeta.watch.color} label="Fast filling" />
            <LegendDot color={riskMeta.critical.color} label="Overflow risk" />
            <LegendDot color={riskMeta.offline.color} label="Offline" />
          </View>
        </View>

        <StationDetail station={selectedStation} />

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionEyebrow}>EXPLAINABLE AUTONOMY</Text>
            <Text style={styles.sectionTitle}>How Autopilot decides</Text>
          </View>
          <View style={styles.pipelineVersionBadge}>
            <Ionicons name="git-network-outline" size={13} color={colors.primary} />
            <Text style={styles.pipelineVersionText}>PIPELINE V2</Text>
          </View>
        </View>

        <DecisionPipeline
          criticalCount={criticalCount}
          routeActive={routeActive}
          completedPickups={completedStationIds.length}
          edgeOnline={edgeOnline}
        />
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionEyebrow}>CLOSED-LOOP RESPONSE</Text>
            <Text style={styles.sectionTitle}>Collection mission</Text>
          </View>
          {routeActive && (
            <View style={styles.routeReadyBadge}>
              <Ionicons name="navigate-outline" size={13} color={colors.primary} />
              <Text style={styles.routeReadyText}>2 CREWS ACTIVE</Text>
            </View>
          )}
        </View>

        {!routeActive ? (
          <View style={styles.missionCard}>
            <View style={styles.missionIconWrap}>
              <Ionicons name="git-branch-outline" size={26} color={colors.primary} />
            </View>
            <Text style={styles.missionTitle}>Prevent the next overflow</Text>
            <Text style={styles.missionCopy}>
              Autopilot partitions urgent stations by service district, then dispatches the
              nearest crew without sending trucks across Hsinchu unnecessarily.
            </Text>
            <View style={styles.aiDecisionRow}>
              <DecisionPill icon="people-outline" text="2 district crews" />
              <DecisionPill icon="leaf-outline" text="4.8 km avoided" />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Generate district collection plan"
              onPress={optimizeRoute}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Ionicons name="sparkles" size={18} color={colors.white} />
              <Text style={styles.primaryButtonText}>Build district dispatch plan</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </Pressable>
            <Text style={styles.estimateDisclaimer}>District assignments and impact values are demo estimates.</Text>
          </View>
        ) : (
          <View style={styles.missionCard}>
            {routeComplete ? (
              <MissionComplete onReset={resetMission} />
            ) : (
              <>
                <View style={styles.missionProgressRow}>
                  <View>
                    <Text style={styles.missionProgressLabel}>PARALLEL DISTRICT DISPATCH</Text>
                    <Text style={styles.missionProgressTitle}>
                      {completedStationIds.length}/{AUTOPILOT_ROUTE.length} pickups verified
                    </Text>
                  </View>
                  <View style={styles.etaBadge}>
                    <Ionicons name="time-outline" size={14} color={colors.warning} />
                    <Text style={styles.etaBadgeText}>ETA 6 min</Text>
                  </View>
                </View>

                <View style={styles.routeTimeline}>
                  {AUTOPILOT_ROUTE_GROUPS.map((group) => (
                    <View key={group.id} style={styles.crewGroup}>
                      <View style={styles.crewHeader}>
                        <View style={[styles.crewDot, { backgroundColor: group.color }]} />
                        <Text style={styles.crewName}>{group.name}</Text>
                        <Text style={styles.crewMeta}>
                          {group.stationIds.length} {group.stationIds.length === 1 ? 'pickup' : 'local stops'}
                        </Text>
                      </View>
                      {group.stationIds.map((stationId, index) => {
                        const station = stations.find((item) => item.id === stationId);
                        if (!station) return null;
                        const completed = completedStationIds.includes(stationId);
                        const active = stationId === nextStopId;

                        return (
                          <Pressable
                            key={stationId}
                            onPress={() => selectStation(stationId)}
                            style={styles.routeStop}
                          >
                            <View style={styles.timelineRail}>
                              <View
                                style={[
                                  styles.timelineNode,
                                  { borderColor: group.color },
                                  completed && styles.timelineNodeComplete,
                                  active && styles.timelineNodeActive,
                                ]}
                              >
                                {completed ? (
                                  <Ionicons name="checkmark" size={12} color={colors.white} />
                                ) : (
                                  <Text style={[styles.timelineNumber, active && styles.timelineNumberActive]}>
                                    {group.code}{index + 1}
                                  </Text>
                                )}
                              </View>
                              {index < group.stationIds.length - 1 && (
                                <View
                                  style={[
                                    styles.timelineLine,
                                    { backgroundColor: `${group.color}40` },
                                    completed && styles.timelineLineComplete,
                                  ]}
                                />
                              )}
                            </View>
                            <View style={styles.routeStopCopy}>
                              <Text style={[styles.routeStopName, completed && styles.routeStopDone]}>
                                {station.name}
                              </Text>
                              <Text style={styles.routeStopMeta}>
                                {completed
                                  ? 'Sensor verified · 3% remaining'
                                  : `${station.currentFill}% projected · ${group.zone} service zone`}
                              </Text>
                            </View>
                            {active && <Text style={styles.nextLabel}>NEXT EVENT</Text>}
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Verify collection at ${nextStop?.name ?? 'next stop'}`}
                  onPress={completeNextStop}
                  style={({ pressed }) => [styles.verifyButton, pressed && styles.pressed]}
                >
                  <View style={styles.verifyIcon}>
                    <Ionicons name="scan-outline" size={19} color="#A7F36B" />
                  </View>
                  <View style={styles.verifyCopy}>
                    <Text style={styles.verifyTitle}>Verify next sensor event at {nextStop?.shortName}</Text>
                    <Text style={styles.verifySubtitle}>Simulate depth sensor returning to empty</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#A7F36B" />
                </Pressable>
              </>
            )}
          </View>
        )}

        <ImpactPanel
          active={routeActive}
          completed={completedStationIds.length}
          complete={routeComplete}
        />

        <View style={styles.edgeStoryCard}>
          <View style={styles.edgeStoryIcon}>
            <Ionicons name="hardware-chip-outline" size={23} color={colors.primary} />
          </View>
          <View style={styles.edgeStoryCopy}>
            <Text style={styles.edgeStoryTitle}>From edge signal to verified action</Text>
            <Text style={styles.edgeStoryText}>
              FRDM-i.MX93 classification and depth readings update the city twin. A collection is
              closed only when the sensor confirms that the bin is empty.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CommandHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.logo}>
          <Ionicons name="leaf" size={22} color={colors.white} />
        </View>
        <View>
          <Text style={styles.appName}>EcoSort</Text>
          <Text style={styles.appSubtitle}>Zero-Overflow Demo</Text>
        </View>
      </View>
      <View style={styles.profileBadge}>
        <Ionicons name="person-outline" size={18} color={colors.primary} />
      </View>
    </View>
  );
}

function HeroMetric({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.heroMetric}>
      <View style={styles.heroMetricValueRow}>
        <Ionicons name={icon} size={13} color="#A7F36B" />
        <Text style={styles.heroMetricValue}>{value}</Text>
      </View>
      <Text style={styles.heroMetricLabel}>{label}</Text>
    </View>
  );
}

function ForecastSwitch({
  value,
  onChange,
}: {
  value: ForecastWindow;
  onChange: (forecast: ForecastWindow) => void;
}) {
  return (
    <View style={styles.forecastSwitch}>
      <ForecastOption label="NOW" selected={value === 'now'} onPress={() => onChange('now')} />
      <ForecastOption
        label="+2H"
        selected={value === 'two_hours'}
        onPress={() => onChange('two_hours')}
      />
    </View>
  );
}

function ForecastOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.forecastOption, selected && styles.forecastSelected]}>
      <Text style={[styles.forecastText, selected && styles.forecastTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function StationDetail({ station }: { station: StationView }) {
  const meta = riskMeta[station.currentRisk];
  return (
    <View style={styles.stationDetailCard}>
      <View style={styles.stationDetailTop}>
        <View style={[styles.stationStatusIcon, { backgroundColor: meta.soft }]}>
          <Ionicons name={meta.icon} size={21} color={meta.color} />
        </View>
        <View style={styles.stationDetailHeading}>
          <View style={styles.stationNameRow}>
            <Text style={styles.stationDetailName}>{station.name}</Text>
            {station.edgeConnected && (
              <View style={styles.edgeBadge}>
                <Ionicons name="hardware-chip" size={10} color={colors.primary} />
                <Text style={styles.edgeBadgeText}>LIVE EDGE</Text>
              </View>
            )}
          </View>
          <Text style={styles.stationDetailMeta}>{station.district} District · Demo location</Text>
        </View>
        <Text style={[styles.stationFill, { color: meta.color }]}>{station.currentFill}%</Text>
      </View>

      <View style={styles.capacityTrack}>
        <View
          style={[
            styles.capacityFill,
            { width: `${Math.max(2, station.currentFill)}%`, backgroundColor: meta.color },
          ]}
        />
      </View>

      <View style={styles.stationStats}>
        <StationStat
          icon="alarm-outline"
          label="Predicted full"
          value={
            station.currentRisk === 'collected'
              ? 'Cleared'
              : station.currentEta === null
                ? 'Unavailable'
                : station.currentEta === 0
                  ? 'Now'
                  : `${station.currentEta} min`
          }
        />
        <View style={styles.stationStatDivider} />
        <StationStat icon="scan-outline" label="Items today" value={`${station.itemsToday}`} />
        <View style={styles.stationStatDivider} />
        <StationStat icon="leaf-outline" label="Diverted" value={`${station.diversionKg} kg`} />
      </View>
    </View>
  );
}

function StationStat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stationStat}>
      <View style={styles.stationStatLabelRow}>
        <Ionicons name={icon} size={12} color={colors.textTertiary} />
        <Text style={styles.stationStatLabel}>{label}</Text>
      </View>
      <Text style={styles.stationStatValue}>{value}</Text>
    </View>
  );
}

function DecisionPill({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.decisionPill}>
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={styles.decisionPillText}>{text}</Text>
    </View>
  );
}

function MissionComplete({ onReset }: { onReset: () => void }) {
  return (
    <View style={styles.completeWrap}>
      <View style={styles.completeIcon}>
        <Ionicons name="checkmark-done" size={30} color={colors.primary} />
      </View>
      <Text style={styles.completeEyebrow}>CLOSED LOOP COMPLETE</Text>
      <Text style={styles.completeTitle}>Zero overflows. Mission verified.</Text>
      <Text style={styles.completeCopy}>
        Both district crews completed their local assignments. All four depth sensors reported
        empty, closing the mission without a cross-city truck transfer.
      </Text>
      <Pressable onPress={onReset} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
        <Ionicons name="refresh" size={16} color={colors.primary} />
        <Text style={styles.resetButtonText}>Reset autopilot demo</Text>
      </Pressable>
    </View>
  );
}

function ImpactPanel({
  active,
  completed,
  complete,
}: {
  active: boolean;
  completed: number;
  complete: boolean;
}) {
  const distance = active ? (4.8 + completed * 0.2).toFixed(1) : '—';
  const minutes = active ? `${18 + completed * 2}` : '—';
  const carbon = active ? (1.0 + completed * 0.1).toFixed(1) : '—';

  return (
    <View style={styles.impactCard}>
      <View style={styles.impactHeading}>
        <View>
          <Text style={styles.impactEyebrow}>PROJECTED MISSION IMPACT</Text>
          <Text style={styles.impactTitle}>{complete ? 'Impact delivered' : 'Smarter collection'}</Text>
        </View>
        <View style={styles.impactLeaf}>
          <Ionicons name="leaf" size={19} color="#A7F36B" />
        </View>
      </View>
      <View style={styles.impactMetrics}>
        <ImpactMetric value={distance} unit={active ? 'km' : ''} label="Travel avoided" />
        <View style={styles.impactDivider} />
        <ImpactMetric value={minutes} unit={active ? 'min' : ''} label="Time saved" />
        <View style={styles.impactDivider} />
        <ImpactMetric value={carbon} unit={active ? 'kg' : ''} label="CO₂ avoided" />
      </View>
      <View style={styles.impactFooter}>
        <Ionicons name="shield-checkmark-outline" size={14} color="#A7F36B" />
        <Text style={styles.impactFooterText}>
          {active ? `${completed}/${AUTOPILOT_ROUTE.length} pickups verified across 2 district crews` : 'Generate a dispatch plan to calculate impact'}
        </Text>
      </View>
    </View>
  );
}

function ImpactMetric({
  value,
  unit,
  label,
}: {
  value: string;
  unit: string;
  label: string;
}) {
  return (
    <View style={styles.impactMetric}>
      <View style={styles.impactValueRow}>
        <Text style={styles.impactValue}>{value}</Text>
        {unit ? <Text style={styles.impactUnit}>{unit}</Text> : null}
      </View>
      <Text style={styles.impactLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F6F3' },
  nonInteractive: { pointerEvents: 'none' },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 38,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  appName: { color: colors.text, fontSize: 24, lineHeight: 27, fontWeight: '900', letterSpacing: -0.7 },
  appSubtitle: { color: colors.textSecondary, fontSize: 11, lineHeight: 15, marginTop: 1 },
  profileBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    marginTop: 20,
    padding: 20,
    paddingBottom: 17,
    borderRadius: 26,
    backgroundColor: '#10271B',
  },
  heroGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -74,
    top: -95,
    backgroundColor: '#275B37',
    opacity: 0.65,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  autopilotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(167,243,107,0.12)',
  },
  autopilotBadgeText: { color: '#A7F36B', fontSize: 9, fontWeight: '900', letterSpacing: 0.9 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#A7F36B' },
  liveText: { color: '#BFD0C4', fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  heroNumber: { color: colors.white, fontSize: 58, lineHeight: 62, fontWeight: '900', letterSpacing: -2.7, marginTop: 18 },
  heroTitle: { color: colors.white, fontSize: 19, lineHeight: 24, fontWeight: '800', letterSpacing: -0.3 },
  heroSubtitle: { maxWidth: 430, color: '#AFC2B5', fontSize: 12, lineHeight: 18, marginTop: 6 },
  heroMetrics: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 19,
    paddingTop: 15,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#365043',
  },
  heroMetric: { flex: 1 },
  heroMetricValueRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetricValue: { color: colors.white, fontSize: 16, fontWeight: '900' },
  heroMetricLabel: { color: '#82968A', fontSize: 9, marginTop: 3 },
  heroDivider: { width: 1, marginHorizontal: 11, backgroundColor: '#365043' },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 27,
    marginBottom: 12,
  },
  sectionEyebrow: { color: colors.primary, fontSize: 9, lineHeight: 13, fontWeight: '900', letterSpacing: 1.1 },
  sectionTitle: { color: colors.text, fontSize: 21, lineHeight: 27, fontWeight: '900', letterSpacing: -0.55 },
  forecastSwitch: { flexDirection: 'row', padding: 3, borderRadius: 10, backgroundColor: '#DFE8E1' },
  forecastOption: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  forecastSelected: { backgroundColor: colors.surface },
  forecastText: { color: colors.textTertiary, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  forecastTextSelected: { color: colors.primary },
  mapCard: {
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#14271C',
    ...shadows.card,
  },
  mapTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 10,
  },
  mapKicker: { color: '#A7F36B', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  mapTimestamp: { color: '#819589', fontSize: 10, marginTop: 2 },
  mapCompass: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#213A2C',
  },
  mapCanvas: {
    position: 'relative',
    height: 300,
    overflow: 'hidden',
    backgroundColor: '#172D21',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#284235',
  },
  districtLabel: { position: 'absolute', color: '#799083', opacity: 0.35, fontSize: 17, fontWeight: '900', letterSpacing: 2 },
  mapRoadMajor: { position: 'absolute', height: 5, borderRadius: 3, backgroundColor: '#385044' },
  mapRoad: { position: 'absolute', height: 2, borderRadius: 2, backgroundColor: '#2D4438' },
  river: { position: 'absolute', height: 15, borderRadius: 10, backgroundColor: '#224B4D', opacity: 0.85 },
  riverLabel: { position: 'absolute', left: '53%', top: '78%', color: '#63A5A3', opacity: 0.7, fontSize: 7, fontWeight: '800', letterSpacing: 1.1 },
  mapGridVerticalOne: { position: 'absolute', left: '33%', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: '#375044', opacity: 0.25 },
  mapGridVerticalTwo: { position: 'absolute', left: '66%', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: '#375044', opacity: 0.25 },
  mapGridHorizontal: { position: 'absolute', left: 0, right: 0, top: '50%', height: StyleSheet.hairlineWidth, backgroundColor: '#375044', opacity: 0.25 },
  routePath: { position: 'absolute', height: 4, borderRadius: 3, backgroundColor: '#A7F36B', shadowColor: '#A7F36B', shadowOpacity: 0.8, shadowRadius: 6 },
  stationMarker: { position: 'absolute', width: 82, alignItems: 'center', marginLeft: -41, marginTop: -18, zIndex: 4 },
  stationMarkerSelected: { zIndex: 8, transform: [{ scale: 1.08 }] },
  markerPin: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  markerRouteNumber: { fontSize: 13, fontWeight: '900' },
  markerLabel: { maxWidth: 82, marginTop: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, backgroundColor: 'rgba(10,24,16,0.83)' },
  markerLabelSelected: { backgroundColor: '#F3FAF5' },
  markerLabelText: { color: '#C8D6CD', fontSize: 8, fontWeight: '800' },
  markerLabelTextSelected: { color: colors.primaryDark },
  pulseRing: { position: 'absolute', top: -3, width: 40, height: 40, borderRadius: 20, borderWidth: 2 },
  mapLegend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { color: '#AFC0B5', fontSize: 8, fontWeight: '700' },
  stationDetailCard: { marginTop: 10, padding: 15, borderRadius: radii.large, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  stationDetailTop: { flexDirection: 'row', alignItems: 'center' },
  stationStatusIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stationDetailHeading: { flex: 1, marginLeft: 10 },
  stationNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  stationDetailName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  stationDetailMeta: { color: colors.textSecondary, fontSize: 10, marginTop: 2 },
  stationFill: { fontSize: 25, fontWeight: '900', letterSpacing: -1 },
  edgeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 3, borderRadius: 5, backgroundColor: colors.primarySoft },
  edgeBadgeText: { color: colors.primary, fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  capacityTrack: { height: 6, overflow: 'hidden', marginTop: 13, borderRadius: 3, backgroundColor: '#E5EBE7' },
  capacityFill: { height: '100%', borderRadius: 3 },
  stationStats: { flexDirection: 'row', alignItems: 'stretch', marginTop: 14 },
  stationStat: { flex: 1 },
  stationStatLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stationStatLabel: { color: colors.textTertiary, fontSize: 8 },
  stationStatValue: { color: colors.text, fontSize: 12, fontWeight: '800', marginTop: 3 },
  stationStatDivider: { width: 1, marginHorizontal: 8, backgroundColor: colors.divider },
  routeReadyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.primarySoft },
  routeReadyText: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  pipelineVersionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.primarySoft },
  pipelineVersionText: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  missionCard: { padding: 18, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  missionIconWrap: { width: 49, height: 49, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  missionTitle: { color: colors.text, fontSize: 19, fontWeight: '900', letterSpacing: -0.35, marginTop: 14 },
  missionCopy: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
  aiDecisionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 },
  decisionPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10, backgroundColor: colors.primarySoft },
  decisionPillText: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' },
  primaryButton: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 17, borderRadius: 15, backgroundColor: colors.primary },
  primaryButtonText: { flex: 1, color: colors.white, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  estimateDisclaimer: { color: colors.textTertiary, fontSize: 8, textAlign: 'center', marginTop: 8 },
  missionProgressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  missionProgressLabel: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  missionProgressTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 2 },
  etaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, backgroundColor: colors.warningSoft },
  etaBadgeText: { color: colors.warning, fontSize: 9, fontWeight: '900' },
  routeTimeline: { marginBottom: 5 },
  crewGroup: { marginBottom: 10 },
  crewHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  crewDot: { width: 8, height: 8, borderRadius: 4 },
  crewName: { flex: 1, color: colors.text, fontSize: 11, fontWeight: '900' },
  crewMeta: { color: colors.textTertiary, fontSize: 8, fontWeight: '700' },
  routeStop: { minHeight: 58, flexDirection: 'row', alignItems: 'flex-start' },
  timelineRail: { width: 31, alignItems: 'center' },
  timelineNode: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5EBE7', borderWidth: 1, borderColor: '#CBD6CE' },
  timelineNodeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timelineNodeComplete: { backgroundColor: colors.normal, borderColor: colors.normal },
  timelineNumber: { color: colors.textTertiary, fontSize: 9, fontWeight: '900' },
  timelineNumberActive: { color: colors.white },
  timelineLine: { width: 2, height: 34, backgroundColor: '#DCE5DE' },
  timelineLineComplete: { backgroundColor: colors.normal },
  routeStopCopy: { flex: 1, paddingLeft: 7, paddingTop: 1 },
  routeStopName: { color: colors.text, fontSize: 12, fontWeight: '800' },
  routeStopDone: { color: colors.normal },
  routeStopMeta: { color: colors.textTertiary, fontSize: 9, marginTop: 3 },
  nextLabel: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 4 },
  verifyButton: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingRight: 14, borderRadius: 17, backgroundColor: '#10271B' },
  verifyIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1F432C' },
  verifyCopy: { flex: 1 },
  verifyTitle: { color: colors.white, fontSize: 12, fontWeight: '800' },
  verifySubtitle: { color: '#90A498', fontSize: 9, marginTop: 3 },
  completeWrap: { alignItems: 'center', paddingVertical: 4 },
  completeIcon: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.normalSoft },
  completeEyebrow: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginTop: 13 },
  completeTitle: { color: colors.text, fontSize: 19, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  completeCopy: { maxWidth: 420, color: colors.textSecondary, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 5 },
  resetButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 11, backgroundColor: colors.primarySoft },
  resetButtonText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  impactCard: { overflow: 'hidden', marginTop: 12, padding: 18, borderRadius: 24, backgroundColor: '#10271B' },
  impactHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  impactEyebrow: { color: '#A7F36B', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  impactTitle: { color: colors.white, fontSize: 17, fontWeight: '900', marginTop: 2 },
  impactLeaf: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1D442C' },
  impactMetrics: { flexDirection: 'row', alignItems: 'stretch', marginTop: 18 },
  impactMetric: { flex: 1 },
  impactValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  impactValue: { color: colors.white, fontSize: 22, fontWeight: '900', letterSpacing: -0.7 },
  impactUnit: { color: '#A7F36B', fontSize: 9, fontWeight: '800' },
  impactLabel: { color: '#82968A', fontSize: 8, marginTop: 3 },
  impactDivider: { width: 1, marginHorizontal: 9, backgroundColor: '#365043' },
  impactFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 17, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#365043' },
  impactFooterText: { color: '#AFC2B5', fontSize: 9, fontWeight: '700' },
  edgeStoryCard: { flexDirection: 'row', gap: 12, marginTop: 12, padding: 16, borderRadius: 20, backgroundColor: colors.primarySoft },
  edgeStoryIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  edgeStoryCopy: { flex: 1 },
  edgeStoryTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: '900' },
  edgeStoryText: { color: '#50705D', fontSize: 10, lineHeight: 15, marginTop: 3 },
  pressed: { opacity: 0.65, transform: [{ scale: 0.99 }] },
});
