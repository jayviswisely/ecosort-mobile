import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';
import type { DisposalEvent } from '@/types';
import {
  getCategoryColor,
  getCategoryIcon,
  getCategorySoftColor,
} from '@/utils/bin';
import { clockTime } from '@/utils/date';

interface ActivityItemProps {
  event: DisposalEvent;
  isLast?: boolean;
}

export function ActivityItem({ event, isLast = false }: ActivityItemProps) {
  const maintenance = event.kind === 'maintenance';
  const categoryName = event.category[0].toUpperCase() + event.category.slice(1);

  return (
    <View style={[styles.row, !isLast && styles.withBorder]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: getCategorySoftColor(event.category) },
        ]}
      >
        <Ionicons
          name={maintenance ? 'checkmark-done-outline' : getCategoryIcon(event.category)}
          size={19}
          color={getCategoryColor(event.category)}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.objectName}>{event.detectedObject}</Text>
        <Text style={styles.meta}>
          {categoryName}
          {event.confidence !== undefined
            ? `  •  ${Math.round(event.confidence * 100)}% confidence`
            : '  •  Maintenance'}
        </Text>
      </View>
      <Text style={styles.time}>{clockTime(event.timestamp)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  withBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  objectName: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  time: {
    color: colors.textTertiary,
    fontSize: 12,
    marginLeft: 8,
  },
});
