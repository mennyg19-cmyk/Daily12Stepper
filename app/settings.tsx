/**
 * Settings screen — theme, reminders, data export/import, about.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Appearance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useIconColors } from '@/lib/iconTheme';
import {
  getThemeMode,
  saveThemeMode,
  type ThemeMode,
} from '@/lib/settings';
import { getCardsCollapsed, setCardsCollapsed } from '@/lib/profile';
import { exportAndShare, importFromFile } from '@/lib/exportImport';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Check, ChevronRight, Lock, User, Shield, Bell } from 'lucide-react-native';

export default function SettingsScreen() {
  const iconColors = useIconColors();
  const router = useRouter();
  const { setColorScheme } = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [cardsCollapsed, setCardsCollapsedState] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const loadSettings = useCallback(async () => {
    const [theme, collapsed] = await Promise.all([
      getThemeMode(),
      getCardsCollapsed(),
    ]);
    setThemeModeState(theme);
    setCardsCollapsedState(collapsed);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAndShare();
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const { imported, message } = await importFromFile();
      Alert.alert(imported ? 'Import complete' : 'Import', message);
      if (imported) {
        const { scheduleAllNotifications } = await import('@/lib/notifications');
        await scheduleAllNotifications();
      }
    } catch (e) {
      Alert.alert('Import failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Settings" rightSlot={<ThemeToggle />} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      >
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          className="rounded-2xl p-4 bg-card border border-border flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <User size={20} color={iconColors.primary} />
            <View className="ml-3">
              <Text className="text-base font-semibold text-foreground">Profile</Text>
              <Text className="text-sm text-muted-foreground">
                Name, birthday, addictions, sponsor work time
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={iconColors.muted} />
        </TouchableOpacity>

        <View className="mt-6 rounded-2xl p-4 bg-card border border-border">
          <Text className="text-base font-semibold text-foreground mb-2">Appearance</Text>
          <Text className="text-xs text-muted-foreground mb-3">
            Choose how the app looks. Light = bright, Dark = easy on the eyes, System = match your device.
          </Text>
          <View className="flex-row gap-2 mb-2">
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={async () => {
                  setThemeModeState(mode);
                  await saveThemeMode(mode);
                  const resolved = mode === 'system' ? (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light') : mode;
                  setColorScheme(resolved);
                }}
                className={`flex-1 py-2.5 rounded-xl border items-center ${
                  themeMode === mode ? 'bg-primary border-primary' : 'border-border'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    themeMode === mode ? 'text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  {mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-xs text-muted-foreground mb-2">
            Light: bright theme. Dark: softer dark theme. System: follows your device setting.
          </Text>
          <TouchableOpacity
            onPress={async () => {
              const next = !cardsCollapsed;
              setCardsCollapsedState(next);
              await setCardsCollapsed(next);
            }}
            className="flex-row items-center justify-between py-2 border-t border-border mt-2"
          >
            <Text className="text-sm text-muted-foreground">Collapse step cards</Text>
            <View
              className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                cardsCollapsed ? 'bg-primary border-primary' : 'border-muted-foreground'
              }`}
            >
              {cardsCollapsed && <Check size={14} color={iconColors.primaryForeground} />}
            </View>
          </TouchableOpacity>
          <Text className="text-xs text-muted-foreground mt-1">
            When on, only step titles show on the dashboard — no preview text.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/privacy')}
          className="mt-4 rounded-2xl p-4 bg-card border border-border flex-row items-center justify-between min-h-[72px]"
        >
          <View className="flex-row items-center flex-1 min-w-0 mr-3">
            <Shield size={20} color={iconColors.primary} style={{ marginRight: 12 }} />
            <View className="flex-1 min-w-0">
              <Text className="text-base font-semibold text-foreground">Privacy lock</Text>
              <Text className="text-sm text-muted-foreground" numberOfLines={2}>
                Face ID or password for sensitive data
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={iconColors.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/app-lock')}
          className="mt-4 rounded-2xl p-4 bg-card border border-border flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <Lock size={20} color={iconColors.primary} />
            <View className="ml-3">
              <Text className="text-base font-semibold text-foreground">App Lock</Text>
              <Text className="text-sm text-muted-foreground">
                Block apps until commitment (Cape-style)
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={iconColors.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/notifications')}
          className="mt-4 rounded-2xl p-4 bg-card border border-border flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 min-w-0 mr-3">
            <Bell size={20} color={iconColors.primary} style={{ marginRight: 12 }} />
            <View className="flex-1 min-w-0">
              <Text className="text-base font-semibold text-foreground">Notifications</Text>
              <Text className="text-sm text-muted-foreground" numberOfLines={2}>
                Commitment, stepwork, per-step, and tool reminders
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={iconColors.muted} />
        </TouchableOpacity>

        <View className="mt-6 rounded-2xl p-4 bg-card border border-border">
          <Text className="text-base font-semibold text-foreground mb-2">Data</Text>
          <Text className="text-sm text-muted-foreground mb-4">
            Export and import your data. All data stays on your device.
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleExport}
              disabled={exporting}
              className="flex-1 rounded-xl py-3 bg-primary items-center"
            >
              <Text className="text-primary-foreground font-semibold">
                {exporting ? 'Exporting…' : 'Export'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleImport}
              disabled={importing}
              className="flex-1 rounded-xl py-3 border border-border items-center"
            >
              <Text className="text-foreground font-semibold">
                {importing ? 'Importing…' : 'Import'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-6">
          <Text className="text-sm text-muted-foreground text-center">
            Daily 12 Stepper v1.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
