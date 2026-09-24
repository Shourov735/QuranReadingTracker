import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { AndroidImportance, AndroidNotificationVisibility } from 'expo-notifications/build/NotificationChannelManager.types';
import { SchedulableTriggerInputTypes, AndroidNotificationPriority } from 'expo-notifications/build/Notifications.types';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import type { ReminderSettings } from '../types/settings';
import { createDefaultReminderSettings } from '../types/settings';

const REMINDER_SETTINGS_KEY = 'quran-reading-tracker:reminder-settings';
const REMINDER_CHANNEL_ID = 'quran-reading-reminders';
const DAILY_REMINDER_ID = 'quran-daily-reminder';
const TOMORROW_REMINDER_ID = 'quran-tomorrow-reminder';
const REMINDER_TITLE = 'Quran Reading Tracker';
const REMINDER_BODY = "Don't forget to read the Qur'an today.";

// Deep-import expo-notifications internals: its main entry eagerly registers a push-token listener, which throws in Expo Go on Android (SDK 53+).
setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Daily reading reminder',
      description: 'Daily reminders to read Quran',
      importance: AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      enableLights: true,
      lightColor: '#208AEF',
      showBadge: true,
      lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
    });
  }
}

export async function checkNotificationPermissions(): Promise<boolean> {
  try {
    const permissions = await getPermissionsAsync();
    return permissions.granted || permissions.status === 'granted';
  } catch {
    return false;
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    await setupNotificationChannel();
    const existing = await getPermissionsAsync();
    if (existing.granted || existing.status === 'granted') {
      return true;
    }
    const requested = await requestPermissionsAsync();
    return requested.granted || requested.status === 'granted';
  } catch {
    return false;
  }
}

export async function sendTestNotification(): Promise<boolean> {
  try {
    await setupNotificationChannel();
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return false;
    }
    await scheduleNotificationAsync({
      content: {
        title: REMINDER_TITLE,
        body: 'Daily reminders are working! You will receive notifications at your scheduled time.',
        sound: 'default',
        priority: AndroidNotificationPriority.HIGH,
      },
      trigger: {
        channelId: REMINDER_CHANNEL_ID,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
    if (raw === null) {
      return createDefaultReminderSettings();
    }
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.enabled === 'boolean' &&
      typeof parsed.hour === 'number' &&
      typeof parsed.minute === 'number'
    ) {
      return parsed as ReminderSettings;
    }
    return createDefaultReminderSettings();
  } catch {
    return createDefaultReminderSettings();
  }
}

export async function setReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
  await ensureDailyReminderScheduled();
}

export { formatReminderTime, getReminderTimeLabel } from '../domain/progress-logic';

let reconcileInFlight: Promise<void> | null = null;

export function ensureDailyReminderScheduled(): Promise<void> {
  if (reconcileInFlight !== null) {
    return reconcileInFlight;
  }
  reconcileInFlight = reconcileReminderSchedule().finally(() => {
    reconcileInFlight = null;
  });
  return reconcileInFlight;
}

async function reconcileReminderSchedule(): Promise<void> {
  try {
    await setupNotificationChannel();
    const settings = await getReminderSettings();
    const scheduled = await getAllScheduledNotificationsAsync();
    const hasDaily = scheduled.some((request) => request.identifier === DAILY_REMINDER_ID);
    const hasTomorrow = scheduled.some((request) => request.identifier === TOMORROW_REMINDER_ID);

    if (!settings.enabled) {
      if (hasDaily) {
        await cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
      }
      if (hasTomorrow) {
        await cancelScheduledNotificationAsync(TOMORROW_REMINDER_ID);
      }
      return;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return;
    }

    if (hasTomorrow) {
      await cancelScheduledNotificationAsync(TOMORROW_REMINDER_ID);
    }
    if (hasDaily) {
      await cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
    }
    await scheduleDailyReminder(settings.hour, settings.minute);
  } catch {
  }
}

async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  await scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: REMINDER_TITLE,
      body: REMINDER_BODY,
      sound: 'default',
      priority: AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
}
