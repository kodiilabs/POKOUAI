import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const FOLLOWUP_DAYS = 7;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export interface FollowUpReminderInput {
  loopId: number;
  diseaseName: string;
  body: string;
}

export async function scheduleFollowUpReminder(
  input: FollowUpReminderInput,
): Promise<{ id: string; firesAt: string }> {
  const ok = await ensureNotificationPermission();
  if (!ok) throw new Error('notification permission denied');

  const firesAt = new Date(Date.now() + FOLLOWUP_DAYS * 24 * 60 * 60 * 1000);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('followup', {
      name: 'Follow-up reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: undefined,
    });
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: input.diseaseName,
      body: input.body,
      data: { loopId: input.loopId, kind: 'followup' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: firesAt },
  });
  return { id, firesAt: firesAt.toISOString() };
}

export async function cancelReminder(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    /* already fired or invalid */
  }
}

export { FOLLOWUP_DAYS };
