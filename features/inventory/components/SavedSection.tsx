import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  title: string;
  emptyMessage: string;
  hasEntries: boolean;
  children: React.ReactNode;
}

export function SavedSection({ title, emptyMessage, hasEntries, children }: Props) {
  return (
    <View className="rounded-2xl p-4 bg-card border border-border mt-4">
      <Text className="text-base font-semibold text-foreground mb-3">{title}</Text>
      {!hasEntries ? (
        <Text className="text-sm text-muted-foreground">{emptyMessage}</Text>
      ) : (
        <View className="gap-3">{children}</View>
      )}
    </View>
  );
}
