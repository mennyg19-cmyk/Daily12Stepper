/**
 * Full-screen overlay when privacy lock is active.
 * Prompts for Face ID / password to unlock.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Lock, Fingerprint } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import type { PrivacyLockMode } from '@/lib/privacy';

interface Props {
  lockMode: PrivacyLockMode;
  onAuthenticate: (password?: string) => Promise<boolean>;
  onCancel?: () => void;
}

export function PrivacyLockOverlay({ lockMode, onAuthenticate, onCancel }: Props) {
  const iconColors = useIconColors();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBiometric = async () => {
    setLoading(true);
    setError('');
    try {
      const ok = await onAuthenticate();
      if (!ok) setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async () => {
    if (!password.trim()) {
      setError('Enter password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const ok = await onAuthenticate(password);
      if (!ok) {
        setError('Wrong password');
        setPassword('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background justify-center items-center px-8">
      <Lock size={48} color={iconColors.muted} className="mb-4" />
      <Text className="text-xl font-semibold text-foreground text-center mb-2">
        Sensitive data locked
      </Text>
      <Text className="text-sm text-muted-foreground text-center mb-6">
        Inventories, sobriety dates, and app lock are protected. Unlock to view.
      </Text>

      {lockMode === 'biometric' && (
        <TouchableOpacity
          onPress={handleBiometric}
          disabled={loading}
          className="flex-row items-center gap-2 px-8 py-4 rounded-xl bg-primary mb-4"
        >
          <Fingerprint size={24} color={iconColors.primaryForeground} />
          <Text className="text-primary-foreground font-semibold">
            Unlock with Face ID / Touch ID
          </Text>
        </TouchableOpacity>
      )}

      {(lockMode === 'password' || lockMode === 'biometric') && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full"
        >
          <TextInput
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor={iconColors.muted}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground mb-2"
          />
          {error ? (
            <Text className="text-destructive text-sm mb-2">{error}</Text>
          ) : null}
          <TouchableOpacity
            onPress={handlePassword}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary items-center"
          >
            <Text className="text-primary-foreground font-semibold">Unlock</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}

      {onCancel && (
        <TouchableOpacity onPress={onCancel} className="mt-6 py-2">
          <Text className="text-muted-foreground text-sm">Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
