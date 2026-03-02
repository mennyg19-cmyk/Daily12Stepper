/**
 * Privacy lock settings — Face ID / Password for sensitive data.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useIconColors } from '@/lib/iconTheme';
import {
  getPrivacyLockMode,
  setPrivacyLockMode,
  setPrivacyPassword,
  hasBiometricHardware,
  getBiometricType,
  type PrivacyLockMode,
} from '@/lib/privacy';
import { usePrivacyContext } from '@/contexts/PrivacyContext';

export default function PrivacySettingsScreen() {
  const iconColors = useIconColors();
  const router = useRouter();
  const { refreshLockState } = usePrivacyContext();
  const [mode, setMode] = useState<PrivacyLockMode>('off');
  const [hasBiometric, setHasBiometric] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Face ID / Touch ID');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [m, bio, label] = await Promise.all([
      getPrivacyLockMode(),
      hasBiometricHardware(),
      getBiometricType(),
    ]);
    setMode(m);
    setHasBiometric(bio);
    setBiometricLabel(label);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSetMode = async (newMode: PrivacyLockMode) => {
    if (newMode === 'password') {
      if (password.length < 4) {
        Alert.alert('Password too short', 'Use at least 4 characters.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Passwords do not match');
        return;
      }
    }
    setSaving(true);
    try {
      await setPrivacyLockMode(newMode);
      if (newMode === 'password') {
        await setPrivacyPassword(password);
        setPassword('');
        setConfirmPassword('');
      }
      setMode(newMode);
      await refreshLockState();
    } catch (e) {
      Alert.alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    setSaving(true);
    try {
      await setPrivacyLockMode('off');
      setMode('off');
      await refreshLockState();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Privacy lock" rightSlot={<ThemeToggle />} showBack onBackPress={() => router.replace('/settings')} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      >
        <Text className="text-sm text-muted-foreground mb-4">
          Lock inventories, sobriety dates, and app lock rules behind Face ID or a password.
        </Text>

        <View className="rounded-2xl p-4 bg-card border border-border">
          <Text className="text-base font-semibold text-foreground mb-3">Lock method</Text>
          <View className="gap-2">
            <TouchableOpacity
              onPress={() => handleDisable()}
              disabled={saving}
              className={`rounded-xl py-3 px-4 ${
                mode === 'off' ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <Text
                className={mode === 'off' ? 'text-primary-foreground font-medium' : 'text-foreground'}
              >
                Off
              </Text>
            </TouchableOpacity>
            {hasBiometric && (
              <TouchableOpacity
                onPress={() => handleSetMode('biometric')}
                disabled={saving}
                className={`rounded-xl py-3 px-4 ${
                  mode === 'biometric' ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <Text
                  className={
                    mode === 'biometric' ? 'text-primary-foreground font-medium' : 'text-foreground'
                  }
                >
                  {biometricLabel}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                if (mode !== 'password') {
                  setMode('password');
                  setPassword('');
                  setConfirmPassword('');
                }
              }}
              className={`rounded-xl py-3 px-4 ${
                mode === 'password' ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <Text
                className={
                  mode === 'password' ? 'text-primary-foreground font-medium' : 'text-foreground'
                }
              >
                Password
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {mode === 'password' && (
          <View className="mt-4 rounded-2xl p-4 bg-card border border-border">
            <Text className="text-base font-semibold text-foreground mb-2">Set password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password (min 4)"
              secureTextEntry
              placeholderTextColor={iconColors.muted}
              className="rounded-xl px-4 py-3 bg-muted border border-border text-foreground mb-2"
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm"
              secureTextEntry
              placeholderTextColor={iconColors.muted}
              className="rounded-xl px-4 py-3 bg-muted border border-border text-foreground mb-4"
            />
            <TouchableOpacity
              onPress={() => handleSetMode('password')}
              disabled={saving || password.length < 4 || password !== confirmPassword}
              className="rounded-xl py-3 bg-primary items-center"
            >
              <Text className="text-primary-foreground font-semibold">
                {saving ? 'Saving…' : 'Save password'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
