import { useEffect } from 'react';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { DetectionBanner, FullBinAlarm } from '@/components';
import { prepareBackgroundAlertsAsync } from '@/services/alarm/backgroundAlerts';
import { useEcoStore } from '@/store/useEcoStore';
import { colors } from '@/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const initialize = useEcoStore((state) => state.initialize);
  const dispose = useEcoStore((state) => state.dispose);
  const isReady = useEcoStore((state) => state.isReady);

  useEffect(() => {
    let active = true;

    const prepare = async () => {
      await useEcoStore.persist.rehydrate();
      if (active) await initialize();
    };

    void prepare();
    return () => {
      active = false;
      dispose();
    };
  }, [dispose, initialize]);

  useEffect(() => {
    void prepareBackgroundAlertsAsync();
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar style="dark" />
      {isReady && (fontsLoaded || fontError) ? (
        <View style={styles.app}>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.background },
              headerShown: false,
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="bin/[id]"
              options={{ animation: 'slide_from_right' }}
            />
          </Stack>
          <DetectionBanner />
          <FullBinAlarm />
        </View>
      ) : (
        <View style={styles.loading}>
          <View style={styles.loadingMark} />
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    backgroundColor: colors.background,
  },
  loadingMark: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primary,
    transform: [{ rotate: '8deg' }],
  },
});
