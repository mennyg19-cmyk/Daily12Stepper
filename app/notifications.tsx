/**
 * Notifications — full module for per-type reminders.
 * Commitment, stepwork, per-step, sponsor work time remaining, and tools.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Switch, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChevronDown, ChevronRight, Bell, Plus } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  setNotificationConfig,
  getAllNotificationConfigs,
  type NotificationType,
  type NotificationConfig,
} from '@/lib/notificationConfig';
import {
  requestPermissions,
  scheduleAllNotifications,
} from '@/lib/notifications';
import { getExtraTools, updateExtraTool } from '@/features/extra-tools/database';
import type { ExtraTool } from '@/features/extra-tools/database';

const NOTIFICATION_LABELS: Record<string, string> = {
  commitment: 'Daily commitment',
  stepwork: 'Stepwork',
  sponsor_work_time_remaining: 'Sponsor work time remaining',
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

function parseTime(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(isNaN(h) ? 9 : h, isNaN(m) ? 0 : m, 0, 0);
  return d;
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function NotificationRow({
  type,
  config,
  onToggle,
  onTimeChange,
  onMinutesLeftChange,
  iconColors,
}: {
  type: NotificationType;
  config: NotificationConfig;
  onToggle: (enabled: boolean) => void;
  onTimeChange: (time: string) => void;
  onMinutesLeftChange?: (mins: number) => void;
  iconColors: ReturnType<typeof useIconColors>;
}) {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const label = NOTIFICATION_LABELS[type] ?? type;
  const isSponsorWorkRemaining = type === 'sponsor_work_time_remaining';

  const subtitle =
    type === 'commitment'
      ? 'Remind me to make my daily commitment'
      : type === 'stepwork'
        ? 'Remind me to do stepwork'
        : isSponsorWorkRemaining
          ? `If at this time I still have ${config.minutesLeft ?? 20}+ mins left, remind me`
          : `Remind me for ${label}`;

  return (
    <View className="py-4 border-b border-border last:border-b-0">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-4">
          <Text className="text-base font-medium text-foreground">{label}</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            {subtitle}
          </Text>
        </View>
        <Switch
          value={config.enabled}
          onValueChange={onToggle}
          trackColor={{ false: iconColors.muted, true: iconColors.primary }}
          thumbColor="#fff"
        />
      </View>
      <View className="mt-3 gap-2">
        <View className="flex-row items-center gap-3 flex-wrap">
          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            className="rounded-xl px-4 py-2.5 bg-muted border border-border min-w-[80px]"
          >
            <Text className="text-foreground font-medium text-center">{config.time}</Text>
          </TouchableOpacity>
          {isSponsorWorkRemaining && (
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-muted-foreground">if</Text>
              <TextInput
                value={String(config.minutesLeft ?? 20)}
                onChangeText={(t) => {
                  const n = parseInt(t, 10);
                  if (!isNaN(n) && n >= 0) onMinutesLeftChange?.(n);
                }}
                keyboardType="number-pad"
                className="rounded-xl px-3 py-2 bg-muted border border-border text-foreground w-14 text-center"
              />
              <Text className="text-sm text-muted-foreground">min left</Text>
            </View>
          )}
        </View>
        {showTimePicker && (
          <View>
            <DateTimePicker
              value={parseTime(config.time)}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, d) => {
                if (Platform.OS === 'android') setShowTimePicker(false);
                if (d) onTimeChange(formatTime(d));
              }}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                onPress={() => setShowTimePicker(false)}
                className="mt-2 py-2 bg-primary rounded-lg items-center"
              >
                <Text className="text-primary-foreground font-medium">Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function ToolNotificationRow({
  tool,
  onToggle,
  onTimeChange,
  iconColors,
}: {
  tool: ExtraTool;
  onToggle: (enabled: boolean) => void;
  onTimeChange: (time: string) => void;
  iconColors: ReturnType<typeof useIconColors>;
}) {
  const [showTimePicker, setShowTimePicker] = useState(false);

  return (
    <View className="py-4 border-b border-border last:border-b-0">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-medium text-foreground flex-1 mr-4">{tool.name}</Text>
        <Switch
          value={tool.reminderEnabled}
          onValueChange={onToggle}
          trackColor={{ false: iconColors.muted, true: iconColors.primary }}
          thumbColor="#fff"
        />
      </View>
      {tool.reminderEnabled && (
        <TouchableOpacity
          onPress={() => setShowTimePicker(true)}
          className="mt-3 rounded-xl px-4 py-2.5 bg-muted border border-border self-start"
        >
          <Text className="text-foreground font-medium">{tool.reminderTime ?? '09:00'}</Text>
        </TouchableOpacity>
      )}
      {showTimePicker && (
        <View>
          <DateTimePicker
            value={parseTime(tool.reminderTime ?? '09:00')}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, d) => {
              if (Platform.OS === 'android') setShowTimePicker(false);
              if (d) onTimeChange(formatTime(d));
            }}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              onPress={() => setShowTimePicker(false)}
              className="mt-2 py-2 bg-primary rounded-lg items-center"
            >
              <Text className="text-primary-foreground font-medium">Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default function NotificationsScreen() {
  const iconColors = useIconColors();
  const router = useRouter();
  const [configs, setConfigs] = useState<Record<NotificationType, NotificationConfig> | null>(null);
  const [tools, setTools] = useState<ExtraTool[]>([]);
  const [stepsExpanded, setStepsExpanded] = useState(false);

  const load = useCallback(async () => {
    const [c, t] = await Promise.all([
      getAllNotificationConfigs(),
      getExtraTools(),
    ]);
    setConfigs(c);
    setTools(t);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleToggle = async (type: NotificationType, enabled: boolean) => {
    if (!configs) return;
    const granted = await requestPermissions();
    if (enabled && !granted) {
      Alert.alert('Permission needed', 'Enable notifications to get reminders.');
      return;
    }
    const next = { ...configs[type], enabled };
    setConfigs((prev) => (prev ? { ...prev, [type]: next } : prev));
    await setNotificationConfig(type, next);
    await scheduleAllNotifications();
  };

  const handleTimeChange = async (type: NotificationType, time: string) => {
    if (!configs) return;
    const next = { ...configs[type], time };
    setConfigs((prev) => (prev ? { ...prev, [type]: next } : prev));
    await setNotificationConfig(type, next);
    await scheduleAllNotifications();
  };

  const handleMinutesLeftChange = async (mins: number) => {
    if (!configs) return;
    const next = { ...configs.sponsor_work_time_remaining, minutesLeft: mins };
    setConfigs((prev) => (prev ? { ...prev, sponsor_work_time_remaining: next } : prev));
    await setNotificationConfig('sponsor_work_time_remaining', next);
    await scheduleAllNotifications();
  };

  const handleToolToggle = async (tool: ExtraTool, enabled: boolean) => {
    await updateExtraTool(tool.id, {
      reminderEnabled: enabled,
      reminderTime: enabled ? (tool.reminderTime ?? '09:00') : null,
    });
    setTools((prev) =>
      prev.map((t) => (t.id === tool.id ? { ...t, reminderEnabled: enabled, reminderTime: enabled ? (tool.reminderTime ?? '09:00') : null } : t))
    );
    await scheduleAllNotifications();
  };

  const handleToolTimeChange = async (tool: ExtraTool, time: string) => {
    await updateExtraTool(tool.id, { reminderTime: time });
    setTools((prev) => prev.map((t) => (t.id === tool.id ? { ...t, reminderTime: time } : t)));
    await scheduleAllNotifications();
  };

  if (!configs) return null;

  const mainTypes: NotificationType[] = ['commitment', 'stepwork', 'sponsor_work_time_remaining'];
  const stepTypes: NotificationType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `step_${n}` as NotificationType);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Notifications" rightSlot={<ThemeToggle />} showBack onBackPress={() => router.replace('/settings')} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      >
        <Text className="text-sm text-muted-foreground mb-4">
          Set reminders for commitment, stepwork, sponsor work time, steps, and tools.
        </Text>

        {/* Main reminders */}
        <View className="rounded-2xl p-4 bg-card border border-border mb-6">
          <Text className="text-base font-semibold text-foreground mb-3">Main reminders</Text>
          {mainTypes.map((type) => (
            <NotificationRow
              key={type}
              type={type}
              config={configs[type]}
              onToggle={(enabled) => handleToggle(type, enabled)}
              onTimeChange={(time) => handleTimeChange(type, time)}
              onMinutesLeftChange={type === 'sponsor_work_time_remaining' ? handleMinutesLeftChange : undefined}
              iconColors={iconColors}
            />
          ))}
        </View>

        {/* Per-step reminders — collapsible */}
        <View className="rounded-2xl p-4 bg-card border border-border mb-6 overflow-hidden">
          <TouchableOpacity
            onPress={() => setStepsExpanded(!stepsExpanded)}
            className="flex-row items-center justify-between py-1"
          >
            <Text className="text-base font-semibold text-foreground">Per-step reminders</Text>
            {stepsExpanded ? (
              <ChevronDown size={20} color={iconColors.muted} />
            ) : (
              <ChevronRight size={20} color={iconColors.muted} />
            )}
          </TouchableOpacity>
          <Text className="text-xs text-muted-foreground mt-1 mb-2">
            Optional: set a reminder for each step (e.g. Step 1 at 7am).
          </Text>
          {stepsExpanded &&
            stepTypes.map((type) => (
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

        {/* Tools — with actual notification controls */}
        <View className="rounded-2xl p-4 bg-card border border-border mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-semibold text-foreground">Extra tools</Text>
            <TouchableOpacity
              onPress={() => router.push('/extra-tools')}
              className="flex-row items-center gap-1"
            >
              <Plus size={18} color={iconColors.primary} />
              <Text className="text-sm text-primary font-medium">Add tool</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-muted-foreground mb-3">
            Set a reminder for each tool (e.g. Call sponsor at 9am).
          </Text>
          {tools.length === 0 ? (
            <View className="py-4">
              <Text className="text-sm text-muted-foreground mb-2">No tools yet.</Text>
              <TouchableOpacity
                onPress={() => router.push('/extra-tools')}
                className="flex-row items-center gap-2"
              >
                <Bell size={18} color={iconColors.primary} />
                <Text className="text-sm font-medium text-primary">Add tools in Extra Tools</Text>
              </TouchableOpacity>
            </View>
          ) : (
            tools.map((tool) => (
              <ToolNotificationRow
                key={tool.id}
                tool={tool}
                onToggle={(enabled) => handleToolToggle(tool, enabled)}
                onTimeChange={(time) => handleToolTimeChange(tool, time)}
                iconColors={iconColors}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
