/**
 * Per-type notification configuration.
 * Types: commitment, stepwork, step_1..step_12, sponsor_work_time_remaining, tools (from extra_tools).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'daily12stepper_notif_';

export type NotificationType = 'commitment' | 'stepwork' | `step_${number}` | 'sponsor_work_time_remaining';

export interface NotificationConfig {
  enabled: boolean;
  time: string; // HH:mm
  /** For sponsor_work_time_remaining: minutes left to trigger reminder */
  minutesLeft?: number;
}

function key(type: string): string {
  return PREFIX + type;
}

function defaultConfig(type: NotificationType): NotificationConfig {
  if (type === 'commitment') return { enabled: false, time: '06:00' };
  if (type === 'sponsor_work_time_remaining') return { enabled: false, time: '19:00', minutesLeft: 20 };
  return { enabled: false, time: '09:00' };
}

export async function getNotificationConfig(type: NotificationType): Promise<NotificationConfig> {
  try {
    const v = await AsyncStorage.getItem(key(type));
    if (v) {
      const parsed = JSON.parse(v);
      if (parsed && typeof parsed.enabled === 'boolean' && typeof parsed.time === 'string') {
        return { ...defaultConfig(type), ...parsed };
      }
    }
  } catch {}
  return defaultConfig(type);
}

export async function setNotificationConfig(type: NotificationType, config: NotificationConfig): Promise<void> {
  await AsyncStorage.setItem(key(type), JSON.stringify(config));
}

export async function getAllNotificationConfigs(): Promise<Record<NotificationType, NotificationConfig>> {
  const types: NotificationType[] = [
    'commitment',
    'stepwork',
    'sponsor_work_time_remaining',
    ...([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `step_${n}` as NotificationType)),
  ];
  const result: Record<string, NotificationConfig> = {};
  for (const t of types) {
    result[t] = await getNotificationConfig(t);
  }
  return result as Record<NotificationType, NotificationConfig>;
}
