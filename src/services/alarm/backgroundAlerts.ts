import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

const fullBinChannelId = 'ecosort-full-bin';
const notificationPrefix = 'ecosort-full-bin-';
const deliveredAlertIds = new Set<string>();
const notificationSound = isRunningInExpoGo()
  ? 'default'
  : 'full-bin-alarm.wav';
let notificationsPromise: Promise<NotificationsModule | null> | null = null;

function supportsNativeNotifications(): boolean {
  // Importing expo-notifications itself throws in Android Expo Go as of SDK
  // 53+. A development/release build contains the required native module.
  return !(
    Platform.OS === 'web' ||
    (Platform.OS === 'android' && isRunningInExpoGo())
  );
}

async function getNotificationsAsync(): Promise<NotificationsModule | null> {
  if (!supportsNativeNotifications()) return null;

  notificationsPromise ??= import('expo-notifications')
    .then((Notifications) => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        }),
      });
      return Notifications;
    })
    .catch((error) => {
      console.warn('EcoSort native notifications are unavailable.', error);
      return null;
    });

  return notificationsPromise;
}

function notificationId(alertId: string): string {
  return `${notificationPrefix}${alertId}`;
}

/** Creates the high-priority Android channel and asks for OS permission. */
export async function prepareBackgroundAlertsAsync(): Promise<boolean> {
  const Notifications = await getNotificationsAsync();
  if (!Notifications) return false;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(fullBinChannelId, {
        name: 'Full bin alarms',
        description: 'Urgent alerts when an EcoSort bin requires collection.',
        importance: Notifications.AndroidImportance.MAX,
        enableVibrate: true,
        vibrationPattern: [0, 700, 250, 700, 250, 1_100],
        enableLights: true,
        lightColor: '#D84A4A',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        // Expo Go cannot embed custom native notification sounds. Development
        // and release builds use the same alarm WAV as the foreground pager.
        sound: notificationSound,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;

    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return requested.granted;
  } catch (error) {
    console.warn('Unable to prepare EcoSort background alerts.', error);
    return false;
  }
}

/** Posts one native alarm notification for an unresolved full-bin alert. */
export async function showFullBinNotificationAsync(
  alertId: string,
  binName: string,
): Promise<boolean> {
  const Notifications = await getNotificationsAsync();
  if (!Notifications) return false;
  if (deliveredAlertIds.has(alertId)) return true;
  deliveredAlertIds.add(alertId);

  try {
    const permitted = await prepareBackgroundAlertsAsync();
    if (!permitted) {
      deliveredAlertIds.delete(alertId);
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: notificationId(alertId),
      content: {
        title: 'Collection required',
        body: `${binName} is full. Open EcoSort to respond.`,
        data: { alertId, type: 'full-bin' },
        sound: notificationSound,
        badge: 1,
        color: '#D84A4A',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 700, 250, 700, 250, 1_100],
        interruptionLevel: 'timeSensitive',
      },
      trigger:
        Platform.OS === 'android'
          ? { channelId: fullBinChannelId }
          : null,
    });
    return true;
  } catch (error) {
    deliveredAlertIds.delete(alertId);
    console.warn('Unable to show the EcoSort background alarm.', error);
    return false;
  }
}

/** Removes an alarm notification after staff opens or acknowledges it. */
export async function dismissFullBinNotificationAsync(
  alertId: string,
): Promise<void> {
  const Notifications = await getNotificationsAsync();
  if (!Notifications) return;
  deliveredAlertIds.delete(alertId);

  const id = notificationId(alertId);
  await Promise.allSettled([
    Notifications.cancelScheduledNotificationAsync(id),
    Notifications.dismissNotificationAsync(id),
    Notifications.setBadgeCountAsync(0),
  ]);
}
