/**
 * Onboarding — engaging first-run experience.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIconColors } from '@/lib/iconTheme';
import { setOnboardingComplete } from '@/lib/onboarding';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🌟',
    title: 'Welcome to Daily 12 Stepper',
    subtitle: 'Your companion for working the Twelve Steps. One day at a time.',
  },
  {
    emoji: '🤝',
    title: 'Daily Commitment',
    subtitle: 'Optional 24-hour commitment to your stepwork. Skip anytime — no pressure.',
  },
  {
    emoji: '📖',
    title: 'Steps 1–12',
    subtitle: 'Read, reflect, and track time. Mark steps done. Your sponsor notes stay with you.',
  },
  {
    emoji: '📊',
    title: 'Inventories & Metrics',
    subtitle: 'Step 4 resentments, Step 10 daily inventory, meditation timer, gratitude — all in one place.',
  },
  {
    emoji: '🔒',
    title: 'Privacy First',
    subtitle: 'Everything stays on your device. Face ID lock for sensitive screens. Export anytime.',
  },
  {
    emoji: '✨',
    title: "You're All Set",
    subtitle: "Let's begin your journey.",
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const iconColors = useIconColors();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (index < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: index + 1, animated: true });
      setIndex(index + 1);
    } else {
      await setOnboardingComplete();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    }
  };

  const handleSkip = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setOnboardingComplete();
    onComplete();
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      const i = viewableItems[0]?.index ?? 0;
      setIndex(i);
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row justify-end px-4 pt-2">
        <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text className="text-primary font-semibold text-sm">Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <Text className="text-7xl mb-6">{item.emoji}</Text>
            <Text className="text-2xl font-bold text-foreground text-center px-6">
              {item.title}
            </Text>
            <Text className="text-base text-muted-foreground text-center mt-4 px-8 leading-6">
              {item.subtitle}
            </Text>
          </View>
        )}
      />

      <View className="px-6 pb-8">
        <View className="flex-row justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    backgroundColor: iconColors.primary,
                    opacity,
                  },
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          className="bg-primary py-4 rounded-2xl items-center"
        >
          <Text className="text-primary-foreground font-bold text-lg">
            {index === SLIDES.length - 1 ? "Let's go!" : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
