/**
 * Dashboard — Today screen with commitment card and steps list.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { CommitmentModal } from '@/components/CommitmentModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CheckCircle, ChevronRight, Check } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import { getTodayKey } from '@/utils/date';
import { getCommitmentForDate } from '@/features/commitment/database';
import { getProfile, getGreetingWithName, getCardsCollapsed, isBirthdayToday } from '@/lib/profile';
import { isCommitmentActive, commitmentLabel, getCommitmentRemainingMs } from '@/lib/commitment';
import { getStepsDoneToday } from '@/features/steps/database';
import type { DailyCommitment } from '@/lib/database/schema';
import { STEP_CONTENT } from '@/lib/stepContent';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function formatTodayHeading(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatRemaining(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function CommitmentCountdownCard({
  commitment,
  iconColors,
}: {
  commitment: DailyCommitment;
  iconColors: { success: string };
}) {
  const [remaining, setRemaining] = useState<number | null>(() => getCommitmentRemainingMs(commitment));

  useEffect(() => {
    if (commitment.commitmentType !== '24h' && commitment.commitmentType !== 'custom') {
      setRemaining(null);
      return;
    }
    const tick = () => {
      const r = getCommitmentRemainingMs(commitment);
      setRemaining(r);
      if (r !== null && r <= 0) return;
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [commitment]);

  const showCountdown = commitment.commitmentType === '24h' && remaining !== null && remaining > 0;

  return (
    <View className="bg-card rounded-2xl p-5 border border-border">
      <View className="flex-row items-center gap-2">
        <CheckCircle size={24} color={iconColors.success} />
        <Text className="text-lg font-bold text-foreground">
          {commitmentLabel(commitment.commitmentType, commitment.customDurationMinutes)}
        </Text>
      </View>
      <Text className="text-sm text-muted-foreground mt-1">
        Your commitment is active. Keep going.
      </Text>
      {showCountdown && (
        <Text className="text-xs font-mono text-muted-foreground mt-2 tabular-nums">
          {formatRemaining(remaining)} left
        </Text>
      )}
    </View>
  );
}


export default function DashboardScreen() {
  const iconColors = useIconColors();
  const router = useRouter();
  const [commitment, setCommitment] = useState<DailyCommitment | null>(null);
  const [stepsDone, setStepsDone] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [cardsCollapsed, setCardsCollapsed] = useState(false);
  const [birthdayToday, setBirthdayToday] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const fetchData = useCallback(async () => {
    try {
      const today = getTodayKey();
      const [c, done, profile, collapsed, bday] = await Promise.all([
        getCommitmentForDate(today),
        getStepsDoneToday(today),
        getProfile(),
        getCardsCollapsed(),
        getProfile().then((p) => isBirthdayToday(p.birthday)),
      ]);
      setCommitment(c ?? null);
      setProfileName(profile.name || null);
      setCardsCollapsed(collapsed);
      setBirthdayToday(bday);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStepsDone(done);
    } catch (err) {
      setCommitment(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const hasCommitment = commitment && commitment.commitmentType !== 'none';
  const commitmentActive = commitment && isCommitmentActive(commitment);

  const currentStep =
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find((n) => !stepsDone.has(n)) ?? 12;

  const prevStepsDoneRef = useRef<Set<number>>(new Set());
  const scrollOffsetRef = useRef(0);

  // Only scroll to current step when stepsDone actually changed (e.g. marked done), not on every return
  useEffect(() => {
    if (loading || !scrollRef.current) return;
    const prev = prevStepsDoneRef.current;
    const changed = prev.size !== stepsDone.size || [...prev].some((n) => !stepsDone.has(n));
    prevStepsDoneRef.current = new Set(stepsDone);
    if (changed) {
      const delay = Platform.OS === 'android' ? 350 : 300;
      const t = setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(0, (currentStep - 1) * 88 - 60),
          animated: true,
        });
      }, delay);
      return () => clearTimeout(t);
    }
  }, [stepsDone, currentStep, loading]);

  // Preserve scroll position when returning from another screen
  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      const savedY = scrollOffsetRef.current;
      const timer = setTimeout(() => {
        if (scrollRef.current && savedY > 0) {
          scrollRef.current.scrollTo({ y: savedY, animated: false });
        }
      }, 50);
      return () => clearTimeout(timer);
    }, [])
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-primary tracking-wide">
            Daily 12 Stepper
          </Text>
          <ThemeToggle />
        </View>
        <Text className="text-sm text-muted-foreground mt-1">{formatTodayHeading()}</Text>
        <Text className="text-2xl font-bold text-foreground">
          {getGreetingWithName(profileName)}
          {birthdayToday && ' 🎂'}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={iconColors.primary} />
        }
      >
        {/* Commitment card */}
        {!loading && (
          hasCommitment && commitmentActive ? (
            <CommitmentCountdownCard commitment={commitment} iconColors={iconColors} />
          ) : (
            <TouchableOpacity
              onPress={() => setShowCommitmentModal(true)}
              activeOpacity={0.8}
              className="bg-primary rounded-2xl py-8 px-6 items-center"
            >
              <Text className="text-primary-foreground font-bold text-xl">
                Commit to 24 hrs?
              </Text>
              <Text className="text-primary-foreground/80 text-sm mt-2 underline">
                Make a custom commitment
              </Text>
              <Text className="text-primary-foreground/60 text-xs mt-2">
                Optional — but encouraged
              </Text>
            </TouchableOpacity>
          )
        )}

        {/* Steps 1-12 — full width, done mark, current expanded, rest collapsed */}
        <View className="gap-2">
          <Text className="text-lg font-bold text-foreground">Steps</Text>
          <Text className="text-sm text-muted-foreground -mt-1">
            Tap a step to work through it. Time spent is tracked per step.
          </Text>
          <View className="gap-2 mt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => {
              const done = stepsDone.has(n);
              const isCurrent = n === currentStep;
              return (
                <TouchableOpacity
                  key={n}
                  onPress={() => router.push(`/steps/${n}`)}
                  activeOpacity={0.8}
                  className={`w-full rounded-xl p-4 border border-border ${
                    isCurrent ? 'bg-card' : 'bg-muted/30 opacity-75'
                  }`}
                >
                  <View className="flex-row items-start gap-3">
                    <View className="flex-1">
                      <Text
                        className={`text-base font-bold ${
                          isCurrent ? 'text-foreground' : 'text-muted-foreground'
                        } ${done ? 'line-through' : ''}`}
                      >
                        Step {n}
                      </Text>
                      {!cardsCollapsed && (
                        <Text
                          className={`text-sm mt-1 ${
                            isCurrent ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                          numberOfLines={isCurrent ? 3 : 1}
                        >
                          {STEP_CONTENT[n] ?? ''}
                        </Text>
                      )}
                    </View>
                    <View
                      className={`w-8 h-8 rounded-full border-2 items-center justify-center mt-0.5 ${
                        done ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}
                    >
                      {done && <Check size={18} color={iconColors.primaryForeground} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Extra tools & Metrics */}
        <View className="gap-2">
          <TouchableOpacity
            onPress={() => router.push('/extra-tools')}
            className="flex-row items-center justify-between bg-card rounded-xl p-4 border border-border"
          >
            <Text className="text-base font-semibold text-foreground">Extra Tools</Text>
            <ChevronRight size={20} color={iconColors.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/metrics')}
            className="flex-row items-center justify-between bg-card rounded-xl p-4 border border-border"
          >
            <Text className="text-base font-semibold text-foreground">Metrics</Text>
            <ChevronRight size={20} color={iconColors.muted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
      <CommitmentModal
        visible={showCommitmentModal}
        onClose={() => setShowCommitmentModal(false)}
        onSaved={fetchData}
      />
    </SafeAreaView>
  );
}
