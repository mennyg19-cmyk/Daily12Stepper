/**
 * Notifications — full module for per-type reminders.
 * Commitment, stepwork, per-step, and tools each can have their own notification.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChevronRight, Bell } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  getNotificationConfig,
  setNotificationConfig,
  getAllNotificationConfigs,
  type NotificationType,
  type NotificationConfig,
} from '@/lib/notificationConfig';
import {
  requestPermissions,
  scheduleAllNotifications,
} from '@/lib/notifications';

const NOTIFICATION_LABELS: Record<string, string> = {
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

function NotificationRow({
  type,
  config,
  onToggle,
  onTimeChange,
  iconColors,
}: {
  type: NotificationType;
  config: NotificationConfig;
  onToggle: (enabled: boolean) => void;
  onTimeChange: (time: string) => void;
  iconColors: ReturnType<typeof useIconColors>;
}) {
  const label = NOTIFICATION_LABELS[type] ?? type;
  return (
    <View className="flex-row items-center justify-between py-4 border-b border-border">
      <View className="flex-1">
        <Text className="text-base font-medium text-foreground">{label}</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          {type === 'commitment' ? 'Remind me to make my daily commitment' : type === 'stepwork' ? 'Remind me to do stepwork' : `Remind me for ${label}`}
        </Text>
      </View>
      <View className="flex-row items-center gap-3">
        <TextInput
          value={config.time}
          onChangeText={onTimeChange}
          onBlur={() => {
            const parts = config.time.split(':');
            const h = parseInt(parts[0] ?? '9', 10);
            const m = parseInt(parts[1] ?? '0', 10);
            const valid = !isNaN(h) && h >= 0 && h <= 23 && !isNaN(m) && m >= 0 && m <= 59;
            const normalized = valid
              ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
              : '09:00';
            onTimeChange(normalized);
          }}
          placeholder="09:00"
          keyboardType="numbers-and-punctuation"
          className="rounded-lg px-3 py-2 bg-muted border border-border text-foreground w-16 text-center"
        />
        <TouchableOpacity
          onPress={() => onToggle(!config.enabled)}
          className={`w-10 h-6 rounded-full border-2 items-center justify-center ${
            config.enabled ? 'bg-primary border-primary' : 'border-muted-foreground'
          }`}
        >
          {config.enabled && <View className="w-3 h-3 rounded-full bg-primary-foreground" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const iconColors = useIconColors();
  const router = useRouter();
  const [configs, setConfigs] = useState<Record<NotificationType, NotificationConfig> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const c = await getAllNotificationConfigs();
    setConfigs(c);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (type: NotificationType, enabled: boolean) => {
    if (!configs) return;
    const granted = await requestPermissions();
    if (enabled && !granted) {
      Alert.alert('Permission needed', 'Enable notifications to get reminders.');
      return;
    }
    setSaving(true);
    const next = { ...configs[type], enabled };
    setConfigs((prev) => (prev ? { ...prev, [type]: next } : prev));
    await setNotificationConfig(type, next);
    await scheduleAllNotifications();
    setSaving(false);
  };

  const handleTimeChange = async (type: NotificationType, time: string) => {
    if (!configs) return;
    setSaving(true);
    const next = { ...configs[type], time };
    setConfigs((prev) => (prev ? { ...prev, [type]: next } : prev));
    await setNotificationConfig(type, next);
    await scheduleAllNotifications();
    setSaving(false);
  };

  if (!configs) return null;

  const mainTypes: NotificationType[] = ['commitment', 'stepwork'];
  const stepTypes: NotificationType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `step_${n}` as NotificationType);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Notifications" rightSlot={<ThemeToggle />} showBack onBackPress={() => router.replace('/settings')} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      >
        <Text className="text-sm text-muted-foreground mb-4">
          Set different reminders for commitment, stepwork, and each step. Example: 6am to commit, 9am to call sponsor.
        </Text>

        <View className="rounded-2xl p-4 bg-card border border-border mb-6">
          <Text className="text-base font-semibold text-foreground mb-2">Main reminders</Text>
          {mainTypes.map((type) => (
            <NotificationRow
              key={type}
              type={type}
              config={configs[type]}
              onToggle={(enabled) => handleToggle(type, enabled)}
              onTimeChange={(time) => handleTimeChange(type, time)}
              iconColors={iconColors}
            />
          ))}
        </View>

        <View className="rounded-2xl p-4 bg-card border border-border mb-6">
          <Text className="text-base font-semibold text-foreground mb-2">Per-step reminders</Text>
          <Text className="text-xs text-muted-foreground mb-3">
            Optional: set a reminder for each step (e.g. Step 1 at 7am, Step 4 at 9am).
          </Text>
          {stepTypes.map((type) => (
            <NotificationRow
              key={type}
              type={type}
              config={configs[type]}
              onToggle={(enabled) => handleToggle(type, enabled)}
              onTimeChange={(time) => handleTimeChange(type, time)}
              iconColors={iconColors}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={() => router.push('/extra-tools')}
          className="rounded-2xl p-4 bg-card border border-border flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <Bell size={20} color={iconColors.primary} />
            <View className="ml-3">
              <Text className="text-base font-semibold text-foreground">Tools</Text>
              <Text className="text-sm text-muted-foreground">
                Set reminders per tool (e.g. Call sponsor at 9am) in Extra Tools
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={iconColors.muted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
