/**
 * Push notifications for daily reminders and extra tool reminders.
 */
import * as Notifications from 'expo-notifications';
import { getExtraTools } from '@/features/extra-tools/database';
import { getAllNotificationConfigs } from '@/lib/notificationConfig';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<string | null> {
  const granted = await requestPermissions();
  if (!granted) return null;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily 12 Stepper',
      body: "Time for your daily stepwork. Don't forget your commitment.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'daily-reminder',
    },
  });
  return id;
}

export async function scheduleExtraToolReminders(): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  const tools = await getExtraTools();
  const withReminder = tools.filter((t) => t.reminderEnabled && t.reminderTime);

  for (const tool of withReminder) {
    const [h, m] = (tool.reminderTime ?? '09:00').split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: tool.name,
        body: `Reminder: ${tool.name}`,
        sound: true,
        data: { toolId: tool.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: h,
        minute: m,
        channelId: 'extra-tools',
      },
    });
  }
}

/** Schedule all notifications from config (commitment, stepwork, per-step) + extra tools */
export async function scheduleAllNotifications(): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const configs = await getAllNotificationConfigs();
  const types = ['commitment', 'stepwork', ...([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `step_${n}`))] as const;

  const titles: Record<string, string> = {
    commitment: 'Daily commitment',
    stepwork: 'Stepwork',
    step_1: 'Step 1',
    step_2: 'Step 2',
    step_3: 'Step 3',
    step_4: 'Step 4',
    step_5: 'Step 5',
    step_6: 'Step 6',
    step_7: 'Step 7',
    step_8: 'Step 8',
    step_9: 'Step 9',
    step_10: 'Step 10',
    step_11: 'Step 11',
    step_12: 'Step 12',
  };

  for (const type of types) {
    const cfg = configs[type];
    if (cfg?.enabled && cfg.time) {
      const [h, m] = cfg.time.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: titles[type] ?? type,
          body: type === 'commitment' ? "Time to make your daily commitment." : type === 'stepwork' ? "Time for your stepwork." : `Reminder: ${titles[type]}`,
          sound: true,
          data: { type },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: h ?? 9,
          minute: m ?? 0,
          channelId: 'notifications',
        },
      });
    }
  }

  await scheduleExtraToolReminders();
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
