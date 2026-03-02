/**
 * Metrics / usage screen — Apple Health–style layout with line charts.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useIconColors } from '@/lib/iconTheme';
import { getMetricsSummary } from '@/lib/metrics';
import type { MetricsSummary, DayMetrics } from '@/lib/metrics';
import { format, parseISO } from 'date-fns';

const DAYS_OPTIONS = [7, 14, 30] as const;

const CHART_WIDTH = Dimensions.get('window').width - 48;
const CHART_HEIGHT = 140;
const PADDING = { top: 12, right: 8, bottom: 24, left: 8 };

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (h > 0) return `${h}h ${mins}m`;
  return `${mins}m`;
}

function StepworkLineChart({ days }: { days: DayMetrics[] }) {
  const iconColors = useIconColors();
  const values = days.map((d) => d.stepworkSeconds);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);

  const w = CHART_WIDTH - PADDING.left - PADDING.right;
  const h = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const points: { x: number; y: number }[] = values.map((v, i) => {
    const x = PADDING.left + (i / Math.max(1, values.length - 1)) * w;
    const y = PADDING.top + h - ((v - minVal) / (maxVal - minVal || 1)) * h;
    return { x, y };
  });

  const linePath =
    points.length > 1
      ? points
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
          .join(' ')
      : '';

  const areaPath =
    linePath && points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${PADDING.top + h} L ${points[0].x} ${PADDING.top + h} Z`
      : '';

  return (
    <View className="mb-2">
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="stepworkGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={iconColors.primary} stopOpacity={0.4} />
            <Stop offset="1" stopColor={iconColors.primary} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {areaPath ? (
          <Path d={areaPath} fill="url(#stepworkGrad)" />
        ) : null}
        {linePath ? (
          <Path
            d={linePath}
            fill="none"
            stroke={iconColors.primary}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>
      <View className="flex-row justify-between px-1 mt-1">
        {days.map((d, i) => (
          <Text key={d.date} className="text-[10px] text-muted-foreground" style={{ width: CHART_WIDTH / days.length - 4, textAlign: 'center' }}>
            {format(parseISO(d.date), 'EEE')}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function MetricsScreen() {
  const iconColors = useIconColors();
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [daysBack, setDaysBack] = useState<7 | 14 | 30>(7);

  const load = useCallback(async () => {
    const m = await getMetricsSummary(daysBack);
    setMetrics(m);
  }, [daysBack]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!metrics) return null;

  const avgStepwork = metrics.last7Days.length > 0
    ? metrics.last7Days.reduce((a, d) => a + d.stepworkSeconds, 0) / metrics.last7Days.length
    : 0;
  const avgMeditation = metrics.last7Days.length > 0
    ? metrics.last7Days.reduce((a, d) => a + d.meditationSeconds, 0) / metrics.last7Days.length
    : 0;

  const daysLabel = daysBack === 7 ? 'Last 7 days' : daysBack === 14 ? 'Last 14 days' : 'Last 30 days';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Metrics" rightSlot={<ThemeToggle />} showBack />

      <View className="flex-row gap-2 px-6 py-3 border-b border-border">
        {DAYS_OPTIONS.map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setDaysBack(d)}
            className={`flex-1 py-2 rounded-xl items-center ${
              daysBack === d ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                daysBack === d ? 'text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {d} days
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 96 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={iconColors.primary} />
        }
      >
        {/* Stepwork — Apple Health style */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Stepwork</Text>
          <View className="bg-card rounded-2xl p-5 border border-border overflow-hidden">
            <View className="flex-row items-baseline justify-between mb-4">
              <View>
                <Text className="text-3xl font-bold text-foreground font-mono tabular-nums">
                  {formatDuration(metrics.totalStepworkSeconds)}
                </Text>
                <Text className="text-sm text-muted-foreground mt-0.5">{daysLabel}</Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-semibold text-foreground font-mono tabular-nums">
                  {formatDuration(avgStepwork)}
                </Text>
                <Text className="text-xs text-muted-foreground">Daily average</Text>
              </View>
            </View>
            <StepworkLineChart days={metrics.last7Days} />
          </View>
        </View>

        {/* Meditation — same style */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Meditation</Text>
          <View className="bg-card rounded-2xl p-5 border border-border overflow-hidden">
            <View className="flex-row items-baseline justify-between">
              <View>
                <Text className="text-3xl font-bold text-foreground font-mono tabular-nums">
                  {formatDuration(metrics.totalMeditationSeconds)}
                </Text>
                <Text className="text-sm text-muted-foreground mt-0.5">{daysLabel}</Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-semibold text-foreground font-mono tabular-nums">
                  {formatDuration(avgMeditation)}
                </Text>
                <Text className="text-xs text-muted-foreground">Daily average</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Steps completed */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Steps completed</Text>
          <View className="bg-card rounded-2xl p-5 border border-border">
            <Text className="text-3xl font-bold text-foreground font-mono tabular-nums">
              {metrics.totalStepsCompleted}
            </Text>
            <Text className="text-sm text-muted-foreground mt-0.5">{daysLabel}</Text>
          </View>
        </View>

        {/* Time by step */}
        {metrics.stepBreakdown.length > 0 && (
          <View className="mb-6">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Time by step</Text>
            <View className="bg-card rounded-2xl border border-border overflow-hidden">
              {metrics.stepBreakdown.map(({ stepNumber, totalSeconds }) => (
                <View
                  key={stepNumber}
                  className="flex-row justify-between items-center px-5 py-4 border-b border-border last:border-b-0"
                >
                  <Text className="text-foreground font-medium">Step {stepNumber}</Text>
                  <Text className="text-foreground font-semibold font-mono tabular-nums">
                    {formatDuration(totalSeconds)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Daily breakdown */}
        <View>
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Daily breakdown</Text>
          <View className="gap-3">
            {metrics.last7Days.map((day) => (
              <View
                key={day.date}
                className="bg-card rounded-2xl p-5 border border-border"
              >
                <Text className="text-base font-semibold text-foreground">
                  {format(parseISO(day.date), 'EEE, MMM d')}
                </Text>
                <View className="flex-row flex-wrap gap-x-4 gap-y-1 mt-3">
                  <Text className="text-sm text-muted-foreground">
                    Stepwork <Text className="text-foreground font-medium">{formatDuration(day.stepworkSeconds)}</Text>
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Meditation <Text className="text-foreground font-medium">{formatDuration(day.meditationSeconds)}</Text>
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Steps <Text className="text-foreground font-medium">{day.stepsCompleted}</Text>
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Gratitude <Text className="text-foreground font-medium">{day.gratitudeCount}</Text>
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Tools <Text className="text-foreground font-medium">{day.extraToolsCompleted}</Text>
                  </Text>
                  {day.commitmentMade && (
                    <Text className="text-sm text-primary font-medium">Committed</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
