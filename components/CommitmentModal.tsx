/**
 * Commitment modal — 24h, custom, or skip. No navigation, just modal.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { ModalSurface } from '@/components/ModalSurface';
import {
  ModalTitle,
  ModalLabel,
  ModalInput,
  ModalButton,
  ModalButtonRow,
  ModalSection,
} from '@/components/ModalContent';
import { getTodayKey } from '@/utils/date';
import { saveCommitment } from '@/features/commitment/database';
import type { CommitmentType } from '@/lib/database/schema';

interface CommitmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function CommitmentModal({ visible, onClose, onSaved }: CommitmentModalProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customHours, setCustomHours] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAccept = useCallback(
    async (type: CommitmentType, customMinutes: number | null = null) => {
      setSaving(true);
      try {
        const today = getTodayKey();
        await saveCommitment(today, type, customMinutes);
        setShowCustom(false);
        setCustomHours('');
        onSaved();
        onClose();
      } catch {
        Alert.alert('Error', 'Failed to save commitment. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [onSaved, onClose]
  );

  const handleCustomSubmit = useCallback(async () => {
    const h = parseInt(customHours, 10);
    if (!isNaN(h) && h > 0 && h <= 24) {
      await handleAccept('custom', h * 60);
    }
  }, [customHours, handleAccept]);

  const handleClose = useCallback(() => {
    setShowCustom(false);
    setCustomHours('');
    onClose();
  }, [onClose]);

  if (!showCustom) {
    return (
      <ModalSurface visible={visible} onRequestClose={handleClose}>
        <View className="p-6">
          <ModalTitle>Daily commitment</ModalTitle>
          <Text className="text-muted-foreground text-center text-sm leading-5 mb-6">
            This is entirely optional. You&apos;re committing to your stepwork for the next 24 hours.
            One day at a time.
          </Text>
          <View className="gap-3">
            <TouchableOpacity
              onPress={() => handleAccept('24h')}
              disabled={saving}
              activeOpacity={0.8}
              className="bg-primary py-4 px-6 rounded-xl items-center"
            >
              <Text className="text-primary-foreground font-bold text-base">Yes, 24 hours</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowCustom(true)}
              disabled={saving}
              className="py-3 items-center"
            >
              <Text className="text-primary text-sm text-center underline">
                Make a custom commitment
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAccept('none')}
              disabled={saving}
              className="py-3 items-center"
            >
              <Text className="text-muted-foreground text-sm text-center">
                Not today
              </Text>
            </TouchableOpacity>
          </View>
          <ModalButton variant="secondary" onPress={handleClose} className="mt-6">
            Cancel
          </ModalButton>
        </View>
      </ModalSurface>
    );
  }

  return (
    <ModalSurface visible={visible} onRequestClose={handleClose}>
      <View className="p-6">
        <ModalTitle>Custom commitment</ModalTitle>
        <ModalSection>
          <ModalLabel>How many hours?</ModalLabel>
          <ModalInput
            value={customHours}
            onChangeText={setCustomHours}
            placeholder="e.g. 6, 12, 18"
            keyboardType="number-pad"
          />
        </ModalSection>
        <ModalButtonRow>
          <ModalButton variant="secondary" onPress={() => setShowCustom(false)}>
            Back
          </ModalButton>
          <ModalButton
            variant="primary"
            onPress={handleCustomSubmit}
            disabled={!customHours || parseInt(customHours, 10) <= 0 || saving}
            loading={saving}
          >
            Commit
          </ModalButton>
        </ModalButtonRow>
      </View>
    </ModalSurface>
  );
}
