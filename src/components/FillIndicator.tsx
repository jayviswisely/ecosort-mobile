import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import type { BinStatus } from '@/types';
import { colors } from '@/theme';
import { getStatusColor } from '@/utils/bin';

interface FillIndicatorProps {
  percent: number;
  status: BinStatus;
  height?: number;
}

export function FillIndicator({ percent, status, height = 10 }: FillIndicatorProps) {
  const progress = useRef(new Animated.Value(percent)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percent,
      duration: 520,
      useNativeDriver: false,
    }).start();
  }, [percent, progress]);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.track, { height }]}>
      <Animated.View
        style={[
          styles.fill,
          { width, backgroundColor: getStatusColor(status) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.divider,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
