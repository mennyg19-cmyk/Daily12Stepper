/**
 * App Lock — main entry. Enable/disable, link to presets.
 * Sponsor password: when set, only sponsor can change rules.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChevronRight, Lock, Check, BookOpen, Calendar } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  getActiveConfig,
  getActivePresetId,
  getPresets,
  saveAppLockConfig,
} from '@/features/app-lock/storage';
import type { AppLockConfig } from '@/features/app-lock/types';
import { isAppLockAvailable } from '@/features/app-lock/native';
import { PrivacyGate } from '@/components/PrivacyGate';
import {
  hasSponsorPassword,
  setSponsorPassword,
  verifySponsorPassword,
  clearSponsorPassword,
  isSponsorVerified,
} from '@/lib/sponsorPassword';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalTitle, ModalSection, ModalLabel, ModalInput, ModalButton, ModalButtonRow } from '@/components/ModalContent';

export default function AppLockScreen() {
  const iconColors = useIconColors();
  const router = useRouter();
  const [config, setConfig] = useState<AppLockConfig | null>(null);
  const [activePresetName, setActivePresetName] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const [sponsorPwSet, setSponsorPwSet] = useState(false);
  const [showSponsorPwModal, setShowSponsorPwModal] = useState(false);
  const [sponsorPwMode, setSponsorPwMode] = useState<'set' | 'verify' | 'clear'>('set');
  const [sponsorPwInput, setSponsorPwInput] = useState('');
  const [sponsorPwConfirm, setSponsorPwConfirm] = useState('');
  const [sponsorVerified, setSponsorVerified] = useState(false);

  const load = useCallback(async () => {
    const hasSp = await hasSponsorPassword();
    const [c, a, presets, avail, verified] = await Promise.all([
      getActiveConfig(),
      getActivePresetId(),
      getPresets(),
      isAppLockAvailable(),
      hasSp ? isSponsorVerified() : Promise.resolve(true),
    ]);
    setConfig(c);
    setAvailable(avail);
    setSponsorPwSet(hasSp);
    setSponsorVerified(verified);
    const preset = presets.find((p) => p.id === a);
    setActivePresetName(preset?.name ?? null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const [pendingAction, setPendingAction] = useState<
    { type: 'toggle'; enabled: boolean } | { type: 'bypass' } | { type: 'nav'; path: string }
    | null
  >(null);

  const handleToggle = async (enabled: boolean) => {
    if (!config) return;
    if (sponsorPwSet && !sponsorVerified) {
      setPendingAction({ type: 'toggle', enabled });
      setSponsorPwMode('verify');
      setSponsorPwInput('');
      setShowSponsorPwModal(true);
      return;
    }
    await doToggle(enabled);
  };

  const doToggle = async (enabled: boolean) => {
    if (!config) return;
    if (!available && enabled) {
      Alert.alert(
        'Not available',
        'App Lock requires native support. This feature will work once the native module is implemented for iOS (Family Controls) and Android (Usage Access).'
      );
      return;
    }
    const next = { ...config, enabled };
    setConfig(next);
    await saveAppLockConfig(next);
  };

  const handleSponsorVerify = async () => {
    const ok = await verifySponsorPassword(sponsorPwInput);
    setShowSponsorPwModal(false);
    setSponsorPwInput('');
    if (ok) {
      setSponsorVerified(true);
      const action = pendingAction;
      setPendingAction(null);
      if (action?.type === 'toggle') await doToggle(action.enabled);
      else if (action?.type === 'bypass') {
        const next = !(config?.allowBypassForToday ?? false);
        const updated = { ...config!, allowBypassForToday: next };
        setConfig(updated);
        await saveAppLockConfig(updated);
      } else if (action?.type === 'nav') {
        router.push(action.path as any);
      }
    } else {
      Alert.alert('Wrong password');
      setPendingAction(null);
    }
  };

  const handleSponsorSet = async () => {
    if (sponsorPwInput.length < 4 || sponsorPwInput !== sponsorPwConfirm) {
      Alert.alert(sponsorPwInput.length < 4 ? 'Use at least 4 characters' : 'Passwords do not match');
      return;
    }
    await setSponsorPassword(sponsorPwInput);
    setSponsorPwSet(true);
    setShowSponsorPwModal(false);
    setSponsorPwInput('');
    setSponsorPwConfirm('');
  };

  const handleSponsorClear = async () => {
    const ok = await verifySponsorPassword(sponsorPwInput);
    setShowSponsorPwModal(false);
    setSponsorPwInput('');
    if (ok) {
      await clearSponsorPassword();
      setSponsorPwSet(false);
      setSponsorVerified(false);
    } else {
      Alert.alert('Wrong password');
    }
  };

  if (!config) return null;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="App Lock" rightSlot={<ThemeToggle />} showBack onBackPress={() => router.replace('/settings')} />
    <PrivacyGate onCancel={() => router.replace('/settings')}>
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <View className="rounded-2xl p-4 bg-muted/30 border border-border mb-6">
        <Text className="text-base font-semibold text-foreground mb-2">Why use App Lock?</Text>
        <Text className="text-sm text-muted-foreground leading-6">
          If you find yourself getting distracted by other apps before doing your daily commitment,
          App Lock can help. It blocks or hides apps until you make your commitment — so you focus on
          your stepwork first. You can turn it off at any time or customize it (weekdays only,
          vacations, Jewish holidays) to make it work for you.
        </Text>
      </View>

      <View className="rounded-2xl p-4 bg-card border border-border">
        <Text className="text-base font-semibold text-foreground mb-2">Enable App Lock</Text>
        <Text className="text-sm text-muted-foreground mb-4">
          Block or hide apps until you make your daily commitment. Similar to Cape.
        </Text>
        <TouchableOpacity
          onPress={() => handleToggle(!config.enabled)}
          className="flex-row items-center justify-between py-2"
        >
          <Text className="text-sm text-muted-foreground">
            {config.enabled ? 'Enabled' : 'Disabled'}
          </Text>
          <View
            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              config.enabled ? 'bg-primary border-primary' : 'border-muted-foreground'
            }`}
          >
            {config.enabled && <Check size={14} color={iconColors.primaryForeground} />}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            if (sponsorPwSet && !sponsorVerified) {
              setPendingAction({ type: 'bypass' });
              setSponsorPwMode('verify');
              setSponsorPwInput('');
              setShowSponsorPwModal(true);
              return;
            }
            const next = !(config.allowBypassForToday ?? false);
            const updated = { ...config, allowBypassForToday: next };
            setConfig(updated);
            await saveAppLockConfig(updated);
          }}
          className="flex-row items-center justify-between py-2 border-t border-border mt-2"
        >
          <Text className="text-sm text-muted-foreground">Allow &quot;Skip today&quot;</Text>
          <View
            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              (config.allowBypassForToday ?? false) ? 'bg-primary border-primary' : 'border-muted-foreground'
            }`}
          >
            {(config.allowBypassForToday ?? false) && <Check size={14} color={iconColors.primaryForeground} />}
          </View>
        </TouchableOpacity>
        <Text className="text-xs text-muted-foreground mt-1">
          When on, you can bypass the lock for today if you&apos;re not in the mood.
        </Text>
      </View>

      <View className="mt-6 rounded-2xl p-4 bg-card border border-border">
        <Text className="text-base font-semibold text-foreground mb-2">Sponsor password</Text>
        <Text className="text-sm text-muted-foreground mb-3">
          When set, only someone with the password can change app lock rules. Your sponsor can set this so you can&apos;t change the rules without them.
        </Text>
        {sponsorPwSet ? (
          <TouchableOpacity
            onPress={() => { setSponsorPwMode('clear'); setSponsorPwInput(''); setShowSponsorPwModal(true); }}
            className="py-2"
          >
            <Text className="text-primary font-medium">Remove sponsor password</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => { setSponsorPwMode('set'); setSponsorPwInput(''); setSponsorPwConfirm(''); setShowSponsorPwModal(true); }}
            className="py-2"
          >
            <Text className="text-primary font-medium">Set sponsor password</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={() => {
          if (sponsorPwSet && !sponsorVerified) {
            setPendingAction({ type: 'nav', path: '/app-lock/presets' });
            setSponsorPwMode('verify');
            setSponsorPwInput('');
            setShowSponsorPwModal(true);
          } else {
            router.push('/app-lock/presets');
          }
        }}
        className="mt-4 rounded-2xl p-4 bg-card border border-border flex-row items-center justify-between"
      >
        <View className="flex-row items-center">
          <Lock size={20} color={iconColors.primary} />
          <View className="ml-3">
            <Text className="text-base font-semibold text-foreground">Presets</Text>
            <Text className="text-sm text-muted-foreground mt-1">
              {activePresetName
                ? `Active: ${activePresetName}`
                : 'Light, Medium, Heavy, Extreme + your own'}
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color={iconColors.muted} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          if (sponsorPwSet && !sponsorVerified) {
            setPendingAction({ type: 'nav', path: '/app-lock/preset-schedule' });
            setSponsorPwMode('verify');
            setSponsorPwInput('');
            setShowSponsorPwModal(true);
          } else {
            router.push('/app-lock/preset-schedule');
          }
        }}
        className="mt-4 rounded-2xl p-4 bg-card border border-border flex-row items-center justify-between"
      >
        <View className="flex-row items-center">
          <Calendar size={20} color={iconColors.primary} />
          <View className="ml-3">
            <Text className="text-base font-semibold text-foreground">Preset Schedule</Text>
            <Text className="text-sm text-muted-foreground mt-1">
              Which preset runs when — weekdays, weekends, vacations, Jewish holidays
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color={iconColors.muted} />
      </TouchableOpacity>

      <View className="mt-6 rounded-2xl p-4 bg-card border border-border">
        <Text className="text-base font-semibold text-foreground mb-2">Quick start</Text>
        <Text className="text-sm text-muted-foreground leading-6 mb-4">
          Pick a preset (Light, Medium, Heavy, or Extreme) or create your own. Each preset has full
          instructions — tap any to see how it works and how to set it up. Need help? Check the
          setup guide for step-by-step guidance.
        </Text>
        <View className="flex-row gap-4">
          <TouchableOpacity
            onPress={() => router.push('/app-lock/instructions')}
            className="flex-1 flex-row items-center py-2"
          >
            <BookOpen size={18} color={iconColors.primary} />
            <Text className="text-primary font-medium ml-2">Setup guide</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (sponsorPwSet && !sponsorVerified) {
                setPendingAction({ type: 'nav', path: '/app-lock/presets' });
                setSponsorPwMode('verify');
                setSponsorPwInput('');
                setShowSponsorPwModal(true);
              } else {
                router.push('/app-lock/presets');
              }
            }}
            className="flex-1 flex-row items-center py-2"
          >
            <Lock size={18} color={iconColors.primary} />
            <Text className="text-primary font-medium ml-2">Presets</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!available && (
        <View className="mt-6 rounded-2xl p-4 bg-muted/50 border border-border">
          <Text className="text-sm text-muted-foreground">
            Native support requires implementation. Configure presets now; they will apply when the
            native module is implemented. See docs/APP_LOCK_NATIVE.md.
          </Text>
        </View>
      )}

      <ModalSurface visible={showSponsorPwModal} onRequestClose={() => { setShowSponsorPwModal(false); setPendingAction(null); }}>
        <View className="p-6">
          <ModalTitle>
            {sponsorPwMode === 'set' ? 'Set sponsor password' : sponsorPwMode === 'verify' ? 'Sponsor password required' : 'Remove sponsor password'}
          </ModalTitle>
          <ModalSection>
            <ModalLabel>{sponsorPwMode === 'verify' ? 'Enter password' : 'Password'}</ModalLabel>
            <ModalInput
              value={sponsorPwInput}
              onChangeText={setSponsorPwInput}
              placeholder="••••••"
              secureTextEntry
            />
          </ModalSection>
          {sponsorPwMode === 'set' && (
            <ModalSection>
              <ModalLabel>Confirm</ModalLabel>
              <ModalInput
                value={sponsorPwConfirm}
                onChangeText={setSponsorPwConfirm}
                placeholder="••••••"
                secureTextEntry
              />
            </ModalSection>
          )}
          <ModalButtonRow>
            <ModalButton
              onPress={() => { setShowSponsorPwModal(false); setPendingAction(null); }}
              variant="secondary"
            >
              Cancel
            </ModalButton>
            <ModalButton
              onPress={sponsorPwMode === 'set' ? handleSponsorSet : sponsorPwMode === 'verify' ? handleSponsorVerify : handleSponsorClear}
              variant="primary"
              disabled={!sponsorPwInput.trim() || (sponsorPwMode === 'set' && sponsorPwInput !== sponsorPwConfirm)}
            >
              {sponsorPwMode === 'set' ? 'Set' : sponsorPwMode === 'verify' ? 'Verify' : 'Remove'}
            </ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
    </ScrollView>
    </PrivacyGate>
    </SafeAreaView>
  );
}
