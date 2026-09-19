import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  stopAlarmFeedback,
  triggerAlarmFeedback,
} from '@/services/alarm/alarmFeedback';
import { useEcoStore } from '@/store/useEcoStore';
import { colors, radii } from '@/theme';
import type { BinCategory, FillState } from '@/types';
import {
  getCategoryColor,
  getCategoryIcon,
  getCategorySoftColor,
} from '@/utils/bin';

interface DemoControlPanelProps {
  visible: boolean;
  onClose: () => void;
}

const categories: BinCategory[] = ['plastic', 'metal', 'general'];
const levels: { label: string; value: FillState }[] = [
  { label: 'Empty', value: 'empty' },
  { label: 'Half-full', value: 'half-full' },
  { label: 'Full', value: 'full' },
];
const objects = [
  { name: 'PET Bottle' as const, category: 'Plastic', icon: 'water-outline' as const },
  { name: 'Aluminum Can' as const, category: 'Metal', icon: 'cube-outline' as const },
  { name: 'Tissue' as const, category: 'General', icon: 'document-outline' as const },
  { name: 'Snack Wrapper' as const, category: 'General', icon: 'fast-food-outline' as const },
];

export function DemoControlPanel({ visible, onClose }: DemoControlPanelProps) {
  const [testAlarmPlaying, setTestAlarmPlaying] = useState(false);
  const pendingFullUpdate = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setDemoFill = useEcoStore((state) => state.setDemoFill);
  const simulateDisposal = useEcoStore((state) => state.simulateDisposal);
  const simulateOffline = useEcoStore((state) => state.simulateOffline);
  const resetDemo = useEcoStore((state) => state.resetDemo);

  useEffect(() => {
    if (!visible) {
      stopAlarmFeedback();
      setTestAlarmPlaying(false);
    }
  }, [visible]);

  useEffect(
    () => () => {
      if (pendingFullUpdate.current) clearTimeout(pendingFullUpdate.current);
      stopAlarmFeedback();
    },
    [],
  );

  const selectFillLevel = (category: BinCategory, level: FillState) => {
    if (level !== 'full') {
      setDemoFill(category, level);
      return;
    }

    // A full level opens the interruptive alarm modal. Dismiss this native
    // modal first; presenting two native modals during the same transition can
    // terminate the screen on Android and fail presentation on iOS.
    stopAlarmFeedback();
    setTestAlarmPlaying(false);
    onClose();
    if (pendingFullUpdate.current) clearTimeout(pendingFullUpdate.current);
    pendingFullUpdate.current = setTimeout(() => {
      pendingFullUpdate.current = null;
      setDemoFill(category, level);
    }, 400);
  };

  const toggleTestAlarm = () => {
    if (testAlarmPlaying) {
      stopAlarmFeedback();
      setTestAlarmPlaying(false);
      return;
    }

    void triggerAlarmFeedback('Demo Full Bin');
    setTestAlarmPlaying(true);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PRESENTATION MODE</Text>
            <Text style={styles.title}>Demo Controls</Text>
          </View>
          <Pressable
            accessibilityLabel="Close demo controls"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={23} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Changes happen instantly and are saved on this device. A Full state triggers the staff alarm.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={testAlarmPlaying ? 'Stop test alarm' : 'Play test alarm'}
            onPress={toggleTestAlarm}
            style={({ pressed }) => [
              styles.testAlarmButton,
              testAlarmPlaying && styles.testAlarmButtonPlaying,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.testAlarmIcon,
                testAlarmPlaying && styles.testAlarmIconPlaying,
              ]}
            >
              <Ionicons
                name={testAlarmPlaying ? 'stop' : 'alarm-outline'}
                size={20}
                color={testAlarmPlaying ? colors.danger : colors.white}
              />
            </View>
            <View style={styles.testAlarmCopy}>
              <Text
                style={[
                  styles.testAlarmTitle,
                  testAlarmPlaying && styles.testAlarmTitlePlaying,
                ]}
              >
                {testAlarmPlaying ? 'Stop test alarm' : 'Test staff alarm'}
              </Text>
              <Text style={styles.testAlarmSubtitle}>
                {testAlarmPlaying
                  ? 'Alarm is playing — tap to silence'
                  : 'Play sound and vibration now'}
              </Text>
            </View>
            <Ionicons
              name={testAlarmPlaying ? 'volume-high' : 'play'}
              size={18}
              color={colors.danger}
            />
          </Pressable>

          <SectionHeading title="Bin fill levels" subtitle="Jump to a sensor reading" />
          <View style={styles.stack}>
            {categories.map((category) => (
              <View key={category} style={styles.controlCard}>
                <View style={styles.binHeader}>
                  <View
                    style={[
                      styles.smallIcon,
                      { backgroundColor: getCategorySoftColor(category) },
                    ]}
                  >
                    <Ionicons
                      name={getCategoryIcon(category)}
                      size={18}
                      color={getCategoryColor(category)}
                    />
                  </View>
                  <Text style={styles.binName}>
                    {category[0].toUpperCase() + category.slice(1)}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => simulateOffline(category)}
                    style={({ pressed }) => [styles.offlineButton, pressed && styles.pressed]}
                  >
                    <Ionicons name="cloud-offline-outline" size={15} color={colors.offline} />
                    <Text style={styles.offlineText}>Offline</Text>
                  </Pressable>
                </View>
                <View style={styles.levelRow}>
                  {levels.map((level) => (
                    <Pressable
                      key={level.value}
                      accessibilityRole="button"
                      onPress={() => selectFillLevel(category, level.value)}
                      style={({ pressed }) => [styles.levelButton, pressed && styles.pressed]}
                    >
                      <Text style={styles.levelText}>{level.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <SectionHeading title="Simulate detection" subtitle="Add a classified item" />
          <View style={styles.objectGrid}>
            {objects.map((object) => (
              <Pressable
                key={object.name}
                accessibilityRole="button"
                onPress={() => simulateDisposal(object.name)}
                style={({ pressed }) => [styles.objectButton, pressed && styles.pressed]}
              >
                <View style={styles.objectIcon}>
                  <Ionicons name={object.icon} size={21} color={colors.primary} />
                </View>
                <Text style={styles.objectName}>{object.name}</Text>
                <Text style={styles.objectCategory}>→ {object.category} Bin</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={resetDemo}
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
          >
            <Ionicons name="refresh-outline" size={19} color={colors.danger} />
            <Text style={styles.resetText}>Reset Demo</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 36,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: radii.medium,
    backgroundColor: colors.primarySoft,
  },
  infoText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 13,
    lineHeight: 19,
  },
  testAlarmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    marginTop: 11,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E9B8B8',
  },
  testAlarmButtonPlaying: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  testAlarmIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.danger,
    marginRight: 11,
  },
  testAlarmIconPlaying: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E9B8B8',
  },
  testAlarmCopy: {
    flex: 1,
  },
  testAlarmTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  testAlarmTitlePlaying: {
    color: colors.danger,
  },
  testAlarmSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeading: {
    marginTop: 26,
    marginBottom: 11,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  stack: {
    gap: 10,
  },
  controlCard: {
    padding: 14,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  binHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  binName: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  offlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: colors.offlineSoft,
  },
  offlineText: {
    color: colors.offline,
    fontSize: 11,
    fontWeight: '700',
  },
  levelRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 12,
  },
  levelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  objectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  objectButton: {
    width: '48%',
    flexGrow: 1,
    minWidth: 145,
    padding: 14,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  objectIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: 10,
  },
  objectName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  objectCategory: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    marginTop: 28,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: '#F1CACA',
    backgroundColor: colors.dangerSoft,
  },
  resetText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.62,
  },
});
