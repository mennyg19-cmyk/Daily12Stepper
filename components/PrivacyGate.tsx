/**
 * Wraps sensitive content — shows lock overlay when privacy is enabled and locked.
 */
import React from 'react';
import { View } from 'react-native';
import { usePrivacyContext } from '@/contexts/PrivacyContext';
import { PrivacyLockOverlay } from './PrivacyLockOverlay';

interface Props {
  children: React.ReactNode;
  onCancel?: () => void;
}

export function PrivacyGate({ children, onCancel }: Props) {
  const { isLocked, lockMode, authenticate } = usePrivacyContext();

  if (lockMode === 'off') {
    return <>{children}</>;
  }

  if (isLocked) {
    return (
      <View className="flex-1">
        <PrivacyLockOverlay
          lockMode={lockMode}
          onAuthenticate={authenticate}
          onCancel={onCancel}
        />
      </View>
    );
  }

  return <>{children}</>;
}
