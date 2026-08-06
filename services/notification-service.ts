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

const REMINDER_HOUR = 18;
const REMINDER_MINUTE = 30;
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

export function getReminderTimeLabel(): string {
  return `${String(REMINDER_HOUR).padStart(2, '0')}:${String(REMINDER_MINUTE).padStart(2, '0')}`;
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
    const scheduled = await getAllScheduledNotificationsAsync();
    const hasDaily = scheduled.some((request) => request.identifier === DAILY_REMINDER_ID);
    const hasTomorrow = scheduled.some(
      (request) => request.identifier === TOMORROW_REMINDER_ID,
    );
    if (bothDoneToday) {
      if (!hasTomorrow) {
        if (hasDaily) {
          await cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
        }
        await scheduleTomorrowReminder();
      }
    } else if (!hasDaily) {
      if (hasTomorrow) {
        await cancelScheduledNotificationAsync(TOMORROW_REMINDER_ID);
      }
      await scheduleDailyReminder();
    }
    console.log(
      'Reminder schedule:',
      await getAllScheduledNotificationsAsync(),
    );
  } catch {
    // Notifications are unavailable in some environments (e.g. web) — silently skip.
  }
}

async function scheduleDailyReminder(): Promise<void> {
  await scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: { body: REMINDER_BODY, sound: 'default' },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: REMINDER_MINUTE,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
}

async function scheduleTomorrowReminder(): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);
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
