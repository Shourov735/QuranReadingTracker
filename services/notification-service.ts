import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { formatDateKey, isReadingDayComplete } from '../domain/progress-logic';
import { getReadingDays } from './progress-storage';
import type { ReminderSettings } from '../types/settings';
import { createDefaultReminderSettings } from '../types/settings';

const REMINDER_SETTINGS_KEY = 'quran-reading-tracker:reminder-settings';
const REMINDER_CHANNEL_ID = 'quran-reading-reminders';
const DAILY_REMINDER_ID = 'quran-daily-reminder';
const TOMORROW_REMINDER_ID = 'quran-tomorrow-reminder';
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

export function formatReminderTime(hour: number, minute: number): string {
  let h = hour % 12;
  if (h === 0) {
    h = 12;
  }
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

export function getReminderTimeLabel(settings?: ReminderSettings): string {
  const hour = settings ? settings.hour : 18;
  const minute = settings ? settings.minute : 30;
  return formatReminderTime(hour, minute);
}

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
    if (!Device.isDevice) {
      return;
    }
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

    const permission = await getPermissionsAsync();
    if (permission.status === 'undetermined') {
      const requested = await requestPermissionsAsync();
      if (requested.status !== 'granted') {
        return;
      }
    } else if (permission.status !== 'granted') {
      return;
    }

    await setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Daily reading reminder',
      importance: AndroidImportance.HIGH,
    });

    const readingDays = await getReadingDays();
    const bothDoneToday = isReadingDayComplete(readingDays, formatDateKey(new Date()));

    if (bothDoneToday) {
      if (hasDaily) {
        await cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
      }
      await cancelScheduledNotificationAsync(TOMORROW_REMINDER_ID);
      await scheduleTomorrowReminder(settings.hour, settings.minute);
    } else {
      if (hasTomorrow) {
        await cancelScheduledNotificationAsync(TOMORROW_REMINDER_ID);
      }
      await cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
      await scheduleDailyReminder(settings.hour, settings.minute);
    }
  } catch {
  }
}

async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  await scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: { body: REMINDER_BODY, sound: 'default' },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
}

async function scheduleTomorrowReminder(hour: number, minute: number): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hour, minute, 0, 0);
  await scheduleNotificationAsync({
    identifier: TOMORROW_REMINDER_ID,
    content: { body: REMINDER_BODY, sound: 'default' },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: tomorrow,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
}
