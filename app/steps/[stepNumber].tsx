/**
 * Step module screen — base content, sponsor instructions, timer.
 * Timer auto-starts on focus (or on first scroll for scroll-based steps).
 * Timer auto-stops when leaving the screen.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useIconColors } from '@/lib/iconTheme';
import { getTodayKey } from '@/utils/date';
import { STEP_CONTENT } from '@/lib/stepContent';
import {
  getSponsorInstructions,
  saveSponsorInstructions,
  startStepworkSession,
  endStepworkSession,
  getTotalDurationForStepAndDate,
  markStepDone,
} from '@/features/steps/database';
import {
  Step1Content,
  Step2Content,
  Step3Content,
  Step4Content,
  Step5Content,
  Step6Content,
  Step7Content,
  Step8Content,
  Step9Content,
  Step12Content,
} from '@/features/steps/StepContent';

export default function StepScreen() {
  const params = useLocalSearchParams<{ stepNumber: string }>();
  const router = useRouter();
  const stepNumber = parseInt(params.stepNumber ?? '1', 10);
  const iconColors = useIconColors();
  const today = getTodayKey();

  const [sponsorInstructions, setSponsorInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [totalToday, setTotalToday] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [savedInstructions, setSavedInstructions] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Steps 1–3: reading — auto-start on scroll. Steps 4+: work/input — auto-start on focus.
  const START_ON_SCROLL_STEPS = new Set([1, 2, 3]);
  const startOnScroll = START_ON_SCROLL_STEPS.has(stepNumber);
  const hasStartedFromScroll = useRef(false);

  const loadData = useCallback(async () => {
    try {
      const [instructions, total] = await Promise.all([
        getSponsorInstructions(stepNumber),
        getTotalDurationForStepAndDate(stepNumber, today),
      ]);
      setSponsorInstructions(instructions ?? '');
      setSavedInstructions(instructions ?? '');
      setTotalToday(total);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [stepNumber, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const startTimer = useCallback(async () => {
    if (timerActive) return;
    try {
      const id = await startStepworkSession(stepNumber, today);
      setSessionId(id);
      setTimerActive(true);
      startTimeRef.current = Math.floor(Date.now() / 1000);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    } catch (err) {
      // ignore
    }
  }, [timerActive, stepNumber, today]);

  const stopTimer = useCallback(async () => {
    if (!timerActive || !sessionId) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const now = Math.floor(Date.now() / 1000);
    const duration = now - startTimeRef.current;
    try {
      await endStepworkSession(sessionId, duration);
      setTotalToday((t) => t + duration);
    } catch (err) {
      // ignore
    }
    setTimerActive(false);
    setSessionId(null);
    setElapsed(0);
  }, [timerActive, sessionId]);

  useFocusEffect(
    useCallback(() => {
      if (!startOnScroll) {
        startTimer();
      }
      return () => {
        stopTimer();
      };
    }, [startOnScroll, startTimer, stopTimer])
  );

  const handleScroll = useCallback(() => {
    if (startOnScroll && !hasStartedFromScroll.current) {
      hasStartedFromScroll.current = true;
      startTimer();
    }
  }, [startOnScroll, startTimer]);

  // When app returns from background, recalc elapsed (setInterval is paused when backgrounded)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && timerActive && sessionId) {
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - startTimeRef.current;
        setElapsed(elapsed);
      }
    });
    return () => sub.remove();
  }, [timerActive, sessionId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (timerActive && sessionId) {
        const now = Math.floor(Date.now() / 1000);
        const duration = now - startTimeRef.current;
        endStepworkSession(sessionId, duration).catch(() => {});
      }
    };
  }, []);

  const handleSaveInstructions = useCallback(async () => {
    if (sponsorInstructions === savedInstructions) return;
    setSaving(true);
    try {
      await saveSponsorInstructions(stepNumber, sponsorInstructions.trim() || null);
      setSavedInstructions(sponsorInstructions);
    } finally {
      setSaving(false);
    }
  }, [stepNumber, sponsorInstructions, savedInstructions]);

  const isStep10 = stepNumber === 10;
  const isStep11 = stepNumber === 11;
  const isStep12 = stepNumber === 12;

  const renderStepContent = () => {
    if (stepNumber === 1) {
      return (
        <Step1Content
          stepNumber={stepNumber}
          today={today}
          onStartTimer={() => {
            if (startOnScroll && !hasStartedFromScroll.current) {
              hasStartedFromScroll.current = true;
              startTimer();
            }
          }}
        />
      );
    }
    if (stepNumber === 2) {
      return (
        <Step2Content
          stepNumber={stepNumber}
          today={today}
          onStartTimer={() => {
            if (startOnScroll && !hasStartedFromScroll.current) {
              hasStartedFromScroll.current = true;
              startTimer();
            }
          }}
        />
      );
    }
    if (stepNumber === 3) {
      return (
        <Step3Content
          stepNumber={stepNumber}
          today={today}
          onStartTimer={() => {
            if (startOnScroll && !hasStartedFromScroll.current) {
              hasStartedFromScroll.current = true;
              startTimer();
            }
          }}
        />
      );
    }
    if (stepNumber === 4) {
      return <Step4Content stepNumber={stepNumber} today={today} onStartTimer={startTimer} />;
    }
    if (stepNumber === 5) {
      return <Step5Content stepNumber={stepNumber} today={today} onStartTimer={startTimer} />;
    }
    if (stepNumber === 6) {
      return <Step6Content stepNumber={stepNumber} today={today} onStartTimer={startTimer} />;
    }
    if (stepNumber === 7) {
      return <Step7Content stepNumber={stepNumber} today={today} onStartTimer={startTimer} />;
    }
    if (stepNumber === 8) {
      return <Step8Content stepNumber={stepNumber} today={today} onStartTimer={startTimer} />;
    }
    if (stepNumber === 9) {
      return <Step9Content stepNumber={stepNumber} today={today} onStartTimer={startTimer} />;
    }
    if (isStep10 || isStep11) {
      return null;
    }
    if (isStep12) {
      return <Step12Content stepNumber={stepNumber} today={today} onStartTimer={startTimer} />;
    }
    return null;
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader
        title={`Step ${stepNumber}`}
        rightSlot={<ThemeToggle />}
        showBack
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 96 }}
        onScrollBeginDrag={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Step text — big and eye-catching on every step */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-primary leading-tight">
            Step {stepNumber}
          </Text>
          <Text className="text-lg font-semibold text-foreground mt-1 leading-snug">
            {STEP_CONTENT[stepNumber]}
          </Text>
        </View>

        {/* Step-specific content */}
        {renderStepContent()}

        {/* Sponsor instructions — for steps 1-9 */}
        {stepNumber <= 9 && (
        <View className="mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-2">
            Sponsor instructions (optional)
          </Text>
          <TextInput
            value={sponsorInstructions}
            onChangeText={setSponsorInstructions}
            onFocus={() => {
              if (startOnScroll && !hasStartedFromScroll.current) {
                hasStartedFromScroll.current = true;
                startTimer();
              }
            }}
            onBlur={handleSaveInstructions}
            placeholder="Add notes from your sponsor..."
            placeholderTextColor={iconColors.muted}
            multiline
            numberOfLines={3}
            className="rounded-xl px-4 py-3 text-base bg-input border border-border text-foreground min-h-[80px]"
          />
        </View>
        )}

        {/* Step 10 links */}
        {isStep10 && (
          <View className="gap-3 mb-4">
            <TouchableOpacity
              onPress={() => router.push('/inventory?tab=resentment')}
              className="bg-primary py-4 px-6 rounded-xl items-center"
            >
              <Text className="text-primary-foreground font-bold">Add resentment inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/inventory?tab=fear')}
              className="border border-primary py-4 px-6 rounded-xl items-center"
            >
              <Text className="text-primary font-bold">Add fear inventory</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Step 11 link */}
        {isStep11 && (
          <TouchableOpacity
            onPress={() => router.push('/step11')}
            className="bg-primary py-4 px-6 rounded-xl items-center mb-4"
          >
            <Text className="text-primary-foreground font-bold">Open Step 11</Text>
          </TouchableOpacity>
        )}

        {/* Navigation: Mark done + next, Back to step X, Next without marking */}
        <View className="gap-3 mt-4">
          <TouchableOpacity
            onPress={async () => {
              await markStepDone(stepNumber, today);
              if (stepNumber < 12) router.replace(`/steps/${stepNumber + 1}`);
              else router.back();
            }}
            className="bg-primary py-4 px-6 rounded-xl items-center"
          >
            <Text className="text-primary-foreground font-bold">Mark done and next step</Text>
          </TouchableOpacity>
          {stepNumber > 1 && (
            <TouchableOpacity
              onPress={() => router.push(`/steps/${stepNumber - 1}`)}
              className="border border-border py-4 px-6 rounded-xl items-center"
            >
              <Text className="text-foreground font-semibold">
                Back to step {stepNumber - 1}
              </Text>
            </TouchableOpacity>
          )}
          {stepNumber < 12 && (
            <TouchableOpacity
              onPress={() => router.replace(`/steps/${stepNumber + 1}`)}
              className="py-3 items-center"
            >
              <Text className="text-muted-foreground underline text-sm">
                Next step (without marking done)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
