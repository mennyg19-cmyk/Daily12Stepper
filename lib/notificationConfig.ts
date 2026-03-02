/**
 * Per-type notification configuration.
 * Types: commitment, stepwork, step_1..step_12, tools (from extra_tools).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'daily12stepper_notif_';

export type NotificationType = 'commitment' | 'stepwork' | `step_${number}`;

export interface NotificationConfig {
  enabled: boolean;
  time: string; // HH:mm
}

function key(type: string): string {
  return PREFIX + type;
}

export async function getNotificationConfig(type: NotificationType): Promise<NotificationConfig> {
  try {
    const v = await AsyncStorage.getItem(key(type));
    if (v) {
      const parsed = JSON.parse(v);
      if (parsed && typeof parsed.enabled === 'boolean' && typeof parsed.time === 'string') {
        return parsed;
      }
    }
  } catch {}
  return { enabled: false, time: type === 'commitment' ? '06:00' : '09:00' };
}

export async function setNotificationConfig(type: NotificationType, config: NotificationConfig): Promise<void> {
  await AsyncStorage.setItem(key(type), JSON.stringify(config));
}

export async function getAllNotificationConfigs(): Promise<Record<NotificationType, NotificationConfig>> {
  const types: NotificationType[] = ['commitment', 'stepwork', ...([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `step_${n}` as NotificationType))];
  const result: Record<string, NotificationConfig> = {};
  for (const t of types) {
    result[t] = await getNotificationConfig(t);
  }
  return result as Record<NotificationType, NotificationConfig>;
}
