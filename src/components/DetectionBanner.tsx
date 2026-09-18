import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useEcoStore } from '@/store/useEcoStore';
import { colors, radii, shadows } from '@/theme';

export function DetectionBanner() {
  const notice = useEcoStore((state) => state.notice);
  const clearNotice = useEcoStore((state) => state.clearNotice);
  const translateY = useRef(new Animated.Value(-90)).current;

  useEffect(() => {
    if (!notice) return;

    Animated.spring(translateY, {
      toValue: 0,
      speed: 18,
      bounciness: 5,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -90,
        duration: 240,
        useNativeDriver: true,
      }).start(clearNotice);
    }, 2600);

    return () => clearTimeout(timeout);
  }, [clearNotice, notice, translateY]);

  if (!notice) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <View style={styles.iconWrap}>
        <Ionicons name="scan-outline" size={21} color={colors.white} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{notice.title}</Text>
        <Text style={styles.message}>{notice.message}</Text>
      </View>
      <Ionicons name="checkmark-circle" size={22} color="#81C998" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    zIndex: 100,
    top: 54,
    left: 18,
    right: 18,
    maxWidth: 720,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: radii.medium,
    backgroundColor: colors.black,
    ...shadows.card,
  },
  iconWrap: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginRight: 11,
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  message: {
    color: '#B8C6BD',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
  },
});
