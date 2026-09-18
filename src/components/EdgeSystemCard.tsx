import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/theme';

const details = [
  { label: 'Device', value: 'FRDM-i.MX93', icon: 'hardware-chip-outline' as const },
  { label: 'Inference', value: 'Edge AI', icon: 'sparkles-outline' as const },
  { label: 'Servo Controller', value: 'PCA9685', icon: 'git-network-outline' as const },
  { label: 'Depth Sensors', value: '3 Connected', icon: 'pulse-outline' as const },
];

export function EdgeSystemCard() {
  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>LIVE HARDWARE</Text>
          <Text style={styles.title}>Edge System</Text>
        </View>
        <View style={styles.connectionBadge}>
          <View style={styles.dot} />
          <Text style={styles.connectionText}>Connected</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {details.map((detail) => (
          <View key={detail.label} style={styles.detail}>
            <Ionicons name={detail.icon} size={17} color={colors.primary} />
            <View>
              <Text style={styles.label}>{detail.label}</Text>
              <Text style={styles.value}>{detail.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.large,
    padding: 18,
    backgroundColor: colors.primaryDark,
    overflow: 'hidden',
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    color: '#A7CFB7',
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: colors.white,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
    marginTop: 1,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#68D391',
  },
  connectionText: {
    color: '#DDF4E5',
    fontSize: 11,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
    rowGap: 16,
  },
  detail: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  label: {
    color: '#96B8A3',
    fontSize: 9,
    lineHeight: 12,
  },
  value: {
    color: colors.white,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
});
