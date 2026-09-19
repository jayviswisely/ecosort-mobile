import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import type { BinStatus } from '@/types';
import { colors } from '@/theme';
import { getFillProgress, getStatusColor } from '@/utils/bin';

interface FillIndicatorProps {
  status: BinStatus;
  height?: number;
}

export function FillIndicator({ status, height = 10 }: FillIndicatorProps) {
  const target = getFillProgress(status);
  const progress = useRef(new Animated.Value(target)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: target,
      duration: 520,
      useNativeDriver: false,
    }).start();
  }, [progress, target]);

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
