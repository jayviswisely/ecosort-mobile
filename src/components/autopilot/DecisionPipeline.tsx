import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText as Text } from '@/components/AppText';
import { colors } from '@/theme';

interface DecisionPipelineProps {
  criticalCount: number;
  routeActive: boolean;
  completedPickups: number;
  edgeOnline: boolean;
}

const stages = [
  {
    icon: 'hardware-chip-outline' as const,
    label: 'Edge sensing',
    detail: 'Classification + depth telemetry',
    metric: '340 ms',
  },
  {
    icon: 'git-network-outline' as const,
    label: 'Stream normalization',
    detail: '7 nodes · 21 live signals',
    metric: '99.8%',
  },
  {
    icon: 'analytics-outline' as const,
    label: 'Capacity forecast',
    detail: 'Fill velocity + usage pattern',
    metric: '91.8%',
  },
  {
    icon: 'warning-outline' as const,
    label: 'Risk prioritization',
    detail: 'Overflow window + service SLA',
    metric: 'P0–P3',
  },
  {
    icon: 'navigate-outline' as const,
    label: 'District dispatch',
    detail: 'Service zone × urgency × crew proximity',
    metric: '2 crews',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    label: 'Sensor verification',
    detail: 'Mission closes below 5% fill',
    metric: 'Closed loop',
  },
];

export function DecisionPipeline({
  criticalCount,
  routeActive,
  completedPickups,
  edgeOnline,
}: DecisionPipelineProps) {
  const activeStage = routeActive ? (completedPickups > 0 ? 5 : 4) : 3;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>AUTONOMOUS DECISION PIPELINE</Text>
          <Text style={styles.title}>Signal to collection in 680 ms</Text>
        </View>
        <View style={styles.healthBadge}>
          <View style={[styles.healthDot, !edgeOnline && styles.healthDotOffline]} />
          <Text style={styles.healthText}>{edgeOnline ? 'HEALTHY' : 'DEGRADED'}</Text>
        </View>
      </View>

      <View style={styles.throughputRow}>
        <PipelineMetric value="21" label="signals / cycle" />
        <View style={styles.metricDivider} />
        <PipelineMetric value="2h" label="forecast horizon" />
        <View style={styles.metricDivider} />
        <PipelineMetric value={`${criticalCount}`} label="priority risks" danger={criticalCount > 0} />
      </View>

      <View style={styles.stageList}>
        {stages.map((stage, index) => {
          const reached = index <= activeStage;
          const current = index === activeStage;
          return (
            <View key={stage.label} style={styles.stageRow}>
              <View style={styles.rail}>
                <View style={[styles.stageNode, reached && styles.stageNodeReached, current && styles.stageNodeCurrent]}>
                  <Ionicons name={stage.icon} size={15} color={reached ? '#A7F36B' : '#71847A'} />
                </View>
                {index < stages.length - 1 && <View style={[styles.stageLine, reached && styles.stageLineReached]} />}
              </View>
              <View style={[styles.stageBody, current && styles.stageBodyCurrent]}>
                <View style={styles.stageHeading}>
                  <Text style={[styles.stageLabel, reached && styles.stageLabelReached]}>
                    {String(index + 1).padStart(2, '0')} · {stage.label}
                  </Text>
                  <Text style={[styles.stageMetric, reached && styles.stageMetricReached]}>{stage.metric}</Text>
                </View>
                <Text style={styles.stageDetail}>{stage.detail}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.explainCard}>
        <View style={styles.explainIcon}>
          <Ionicons name="bulb-outline" size={19} color={colors.warning} />
        </View>
        <View style={styles.explainCopy}>
          <Text style={styles.explainLabel}>WHY THIS DECISION</Text>
          <Text style={styles.explainText}>
            Beimen is assigned to the Central corridor crew with Big City and Hsinchu Station.
            NTHU is handled independently by the East District crew, avoiding an unrealistic
            cross-city leg.
          </Text>
        </View>
      </View>

      <View style={styles.featureRow}>
        <FeatureChip label="Fill velocity" />
        <FeatureChip label="Travel time" />
        <FeatureChip label="Service SLA" />
        <FeatureChip label="Truck capacity" />
      </View>
    </View>
  );
}

function PipelineMetric({ value, label, danger = false }: { value: string; label: string; danger?: boolean }) {
  return (
    <View style={styles.pipelineMetric}>
      <Text style={[styles.pipelineMetricValue, danger && styles.pipelineMetricDanger]}>{value}</Text>
      <Text style={styles.pipelineMetricLabel}>{label}</Text>
    </View>
  );
}

function FeatureChip({ label }: { label: string }) {
  return (
    <View style={styles.featureChip}>
      <View style={styles.featureDot} />
      <Text style={styles.featureText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, borderRadius: 24, backgroundColor: '#10271B' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  eyebrow: { color: '#A7F36B', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.white, fontSize: 17, fontWeight: '900', letterSpacing: -0.3, marginTop: 3 },
  healthBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, backgroundColor: '#1D3B29' },
  healthDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#A7F36B' },
  healthDotOffline: { backgroundColor: '#FF6B6B' },
  healthText: { color: '#BFD0C4', fontSize: 7, fontWeight: '900', letterSpacing: 0.6 },
  throughputRow: { flexDirection: 'row', alignItems: 'stretch', marginTop: 17, paddingVertical: 13, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#355043' },
  pipelineMetric: { flex: 1 },
  pipelineMetricValue: { color: colors.white, fontSize: 17, fontWeight: '900' },
  pipelineMetricDanger: { color: '#FF7A7F' },
  pipelineMetricLabel: { color: '#82968A', fontSize: 8, marginTop: 2 },
  metricDivider: { width: 1, marginHorizontal: 10, backgroundColor: '#355043' },
  stageList: { marginTop: 17 },
  stageRow: { minHeight: 63, flexDirection: 'row' },
  rail: { width: 36, alignItems: 'center' },
  stageNode: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B3125', borderWidth: 1, borderColor: '#31493B' },
  stageNodeReached: { backgroundColor: '#1C422A', borderColor: '#386947' },
  stageNodeCurrent: { borderColor: '#A7F36B', shadowColor: '#A7F36B', shadowOpacity: 0.4, shadowRadius: 7 },
  stageLine: { width: 2, flex: 1, backgroundColor: '#2A4134' },
  stageLineReached: { backgroundColor: '#477D53' },
  stageBody: { flex: 1, marginLeft: 7, marginBottom: 10, padding: 10, borderRadius: 12, backgroundColor: '#152D20' },
  stageBodyCurrent: { backgroundColor: '#1A3726', borderWidth: 1, borderColor: '#3F674A' },
  stageHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stageLabel: { color: '#788C80', fontSize: 10, fontWeight: '800' },
  stageLabelReached: { color: '#D8E6DC' },
  stageMetric: { color: '#71847A', fontSize: 9, fontWeight: '900' },
  stageMetricReached: { color: '#A7F36B' },
  stageDetail: { color: '#71847A', fontSize: 8, marginTop: 4 },
  explainCard: { flexDirection: 'row', gap: 10, marginTop: 4, padding: 12, borderRadius: 15, backgroundColor: '#FFF3DE' },
  explainIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  explainCopy: { flex: 1 },
  explainLabel: { color: colors.warning, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  explainText: { color: '#61421F', fontSize: 9, lineHeight: 14, marginTop: 3 },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  featureChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999, backgroundColor: '#1A3325' },
  featureDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#A7F36B' },
  featureText: { color: '#AFC2B5', fontSize: 7, fontWeight: '800' },
});
