import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useEcoStore } from '@/store/useEcoStore';
import { colors, fonts } from '@/theme';

export default function TabsLayout() {
  const unacknowledged = useEcoStore(
    (state) => state.alerts.filter((alert) => !alert.acknowledged).length,
  );

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: fonts.bold,
          fontSize: 11,
          fontWeight: '700',
          marginTop: 1,
        },
        tabBarStyle: {
          height: 66,
          paddingTop: 7,
          paddingBottom: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Autopilot',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'navigate' : 'navigate-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="station"
        options={{
          title: 'Station',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarBadge: unacknowledged > 0 ? unacknowledged : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.danger,
            color: colors.white,
            fontSize: 9,
          },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
