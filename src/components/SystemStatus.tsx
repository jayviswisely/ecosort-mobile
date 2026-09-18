import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/theme';

interface SystemStatusProps {
  station: string;
  online?: boolean;
}

export function SystemStatus({ station, online = true }: SystemStatusProps) {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Ionicons name="location-outline" size={17} color={colors.textSecondary} />
        <View>
          <Text style={styles.label}>STATION</Text>
          <Text style={styles.value}>{station}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.itemRight}>
        <Text style={styles.label}>SYSTEM</Text>
        <View style={styles.onlineRow}>
          <View
            style={[
              styles.onlineDot,
              { backgroundColor: online ? colors.normal : colors.danger },
            ]}
          />
          <Text style={styles.value}>{online ? 'Online' : 'Offline'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    marginTop: 20,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  itemRight: {
    paddingLeft: 15,
    minWidth: 86,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.divider,
    marginHorizontal: 10,
  },
  label: {
    color: colors.textTertiary,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  value: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 1,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 1,
  },
});
