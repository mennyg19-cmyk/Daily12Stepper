/**
 * Step 11 meditation timer.
 * Presets, custom time, optional ding at 5s before end.
 * Keeps counting when app is in background (e.g. Spotify).
 * Saves to metrics. Manual entry supported.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
  Vibration,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { Music, ExternalLink } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalTitle, ModalSection, ModalLabel, ModalInput, ModalButton, ModalButtonRow } from '@/components/ModalContent';
import { recordMeditationSession } from './database';
import { getTodayKey } from '@/utils/date';

const DING_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869-mixkit-meditation-bell-2869.wav';

const PRESETS = [
  { label: '5 min', seconds: 5 * 60 },
  { label: '10 min', seconds: 10 * 60 },
  { label: '15 min', seconds: 15 * 60 },
  { label: '20 min', seconds: 20 * 60 },
  { label: '30 min', seconds: 30 * 60 },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type MusicOption = 'none' | 'apple' | 'spotify' | 'insight';

export function MeditationTimer() {
  const iconColors = useIconColors();
  const [mode, setMode] = useState<'idle' | 'timed' | 'free'>('idle');
  const [presetSeconds, setPresetSeconds] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');
  const [useDing, setUseDing] = useState(true);
  const [musicOption, setMusicOption] = useState<MusicOption>('none');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [insightUrl, setInsightUrl] = useState('');
  const [remaining, setRemaining] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dingFiredRef = useRef(false);
  const startTimeRef = useRef<number>(0);

  const dingPlayer = useAudioPlayer(DING_SOUND_URL, { downloadFirst: true });
  const dingPlayerRef = useRef(dingPlayer);
  dingPlayerRef.current = dingPlayer;

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
  }, []);

  const startTimed = useCallback((totalSeconds: number) => {
    setPresetSeconds(totalSeconds);
    setRemaining(totalSeconds);
    setElapsed(0);
    setMode('timed');
    dingFiredRef.current = false;
    startTimeRef.current = Math.floor(Date.now() / 1000);
  }, []);

  const startFree = useCallback(() => {
    setPresetSeconds(null);
    setRemaining(0);
    setElapsed(0);
    setMode('free');
    startTimeRef.current = Math.floor(Date.now() / 1000);
  }, []);

  const presetSecondsRef = useRef<number | null>(null);
  presetSecondsRef.current = presetSeconds;

  const stop = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const now = Math.floor(Date.now() / 1000);
    const duration = now - startTimeRef.current;
    const preset = presetSecondsRef.current;
    if (duration > 0) {
      const totalSeconds = preset != null ? Math.min(duration, preset) : duration;
      const today = getTodayKey();
      await recordMeditationSession(today, totalSeconds);
    }
    setMode('idle');
  }, []);

  // Timestamp-based: keeps counting when app is in background (e.g. Spotify)
  useEffect(() => {
    const tick = (): void => {
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - startTimeRef.current;
      if (mode === 'timed' && presetSeconds !== null) {
        const r = Math.max(0, presetSeconds - elapsed);
        setRemaining(r);
        if (r <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          const today = getTodayKey();
          recordMeditationSession(today, presetSeconds).catch(() => {});
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setMode('idle');
          return;
        }
        if (useDing && r <= 5 && r > 0 && !dingFiredRef.current) {
          dingFiredRef.current = true;
          try {
            dingPlayerRef.current?.seekTo(0);
            dingPlayerRef.current?.play();
          } catch {}
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          if (Platform.OS === 'android') {
            Vibration.vibrate([0, 200, 100, 200]);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }
      } else if (mode === 'free') {
        setElapsed(elapsed);
      }
    };
    if (mode === 'timed' && presetSeconds !== null) {
      tick();
      timerRef.current = setInterval(tick, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    if (mode === 'free') {
      tick();
      timerRef.current = setInterval(tick, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    return undefined;
  }, [mode, presetSeconds, useDing]);

  // Recalc when app returns from background (interval may have been paused)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && (mode === 'timed' || mode === 'free')) {
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - startTimeRef.current;
        if (mode === 'timed' && presetSeconds !== null) {
          setRemaining(Math.max(0, presetSeconds - elapsed));
        } else if (mode === 'free') {
          setElapsed(elapsed);
        }
      }
    });
    return () => sub.remove();
  }, [mode, presetSeconds]);

  const openMusic = useCallback(() => {
    if (musicOption === 'apple') {
      if (Platform.OS === 'ios') {
        Linking.openURL('App-prefs:root=ACCESSIBILITY').catch(() => {
          Linking.openSettings().catch(() => {});
        });
      } else {
        Linking.openSettings().catch(() => {});
      }
    } else if (musicOption === 'spotify' && spotifyUrl.trim()) {
      const url = spotifyUrl.trim();
      const spotifyDeep = url.includes('spotify.com') ? url : `https://open.spotify.com/playlist/${url}`;
      Linking.openURL(spotifyDeep).catch(() => Linking.openURL(url));
    } else if (musicOption === 'insight' && insightUrl.trim()) {
      Linking.openURL(insightUrl.trim()).catch(() => {});
    }
  }, [musicOption, spotifyUrl, insightUrl]);

  return (
    <View className="gap-6">
      <Text className="text-sm text-muted-foreground">
        Choose a preset or custom time. Tap to start. Ding plays as a sound in your earphones 5 seconds before the end (on top of music).
      </Text>

      {mode === 'idle' && (
        <>
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Presets</Text>
            <View className="flex-row flex-wrap gap-2">
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.label}
                  onPress={() => startTimed(p.seconds)}
                  className="px-4 py-2 rounded-xl bg-card border border-border"
                >
                  <Text className="text-foreground font-medium">{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Custom time</Text>
            <View className="flex-row gap-2 items-center">
              <TextInput
                value={customMinutes}
                onChangeText={setCustomMinutes}
                placeholder="Min"
                keyboardType="number-pad"
                className="flex-1 rounded-xl px-4 py-3 bg-input border border-border text-foreground"
                placeholderTextColor={iconColors.muted}
              />
              <Text className="text-muted-foreground">:</Text>
              <TextInput
                value={customSeconds}
                onChangeText={setCustomSeconds}
                placeholder="Sec"
                keyboardType="number-pad"
                className="flex-1 rounded-xl px-4 py-3 bg-input border border-border text-foreground"
                placeholderTextColor={iconColors.muted}
              />
              <TouchableOpacity
                onPress={() => {
                  const m = parseInt(customMinutes || '0', 10);
                  const s = parseInt(customSeconds || '0', 10);
                  const total = m * 60 + s;
                  if (total > 0) startTimed(total);
                }}
                className="px-4 py-3 rounded-xl bg-primary"
              >
                <Text className="text-primary-foreground font-semibold">Start</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setUseDing(!useDing)}
              className={`px-4 py-2 rounded-xl border ${useDing ? 'bg-primary/20 border-primary' : 'border-border'}`}
            >
              <Text className={useDing ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                Sound ding at 5s
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={startFree}
            className="py-4 rounded-xl border border-dashed border-border items-center"
          >
            <Text className="text-primary font-semibold">Start without timer (track time only)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setManualMinutes(''); setShowManualModal(true); }}
            className="py-3 rounded-xl border border-border items-center"
          >
            <Text className="text-muted-foreground font-medium">Add manual meditation time</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowMusicModal(true)}
            className="flex-row items-center gap-2 py-3 rounded-xl border border-border bg-card px-4"
          >
            <Music size={20} color={iconColors.primary} />
            <Text className="text-foreground font-medium">
              {musicOption === 'none' ? 'Background music' : musicOption === 'apple' ? 'iOS Background Sounds' : musicOption === 'spotify' ? 'Spotify' : 'Insight Timer'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {(mode === 'timed' || mode === 'free') && (
        <View className="items-center py-8">
          <Text className="text-2xl font-bold text-foreground">
            {mode === 'timed' ? formatTime(remaining) : formatTime(elapsed)}
          </Text>
          <Text className="text-sm text-muted-foreground mt-1">
            {mode === 'timed' ? 'remaining' : 'elapsed'}
          </Text>
          {musicOption !== 'none' && (
            <TouchableOpacity
              onPress={openMusic}
              className="mt-4 flex-row items-center gap-2 px-6 py-3 rounded-xl border border-border"
            >
              <ExternalLink size={18} color={iconColors.primary} />
              <Text className="text-foreground font-medium">Open {musicOption === 'apple' ? 'Settings' : musicOption === 'spotify' ? 'Spotify' : 'Insight Timer'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={stop}
            className="mt-6 px-8 py-4 rounded-xl bg-destructive"
          >
            <Text className="text-destructive-foreground font-bold">Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      <ModalSurface visible={showMusicModal} onRequestClose={() => setShowMusicModal(false)}>
        <View className="p-6">
          <ModalTitle>Background music</ModalTitle>
          <ModalSection>
            <ModalLabel>Choose an option</ModalLabel>
            <View className="gap-2 mt-2">
              <TouchableOpacity
                onPress={() => { setMusicOption('none'); setShowMusicModal(false); }}
                className={`p-3 rounded-xl border ${musicOption === 'none' ? 'border-primary bg-primary/10' : 'border-border'}`}
              >
                <Text className="text-foreground">None</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setMusicOption('apple'); setShowMusicModal(false); }}
                className={`p-3 rounded-xl border ${musicOption === 'apple' ? 'border-primary bg-primary/10' : 'border-border'}`}
              >
                <Text className="text-foreground">iOS Background Sounds</Text>
                <Text className="text-xs text-muted-foreground">Opens Accessibility settings (rain, ocean, etc.)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMusicOption('spotify')}
                className={`p-3 rounded-xl border ${musicOption === 'spotify' ? 'border-primary bg-primary/10' : 'border-border'}`}
              >
                <Text className="text-foreground">Spotify playlist</Text>
                <Text className="text-xs text-muted-foreground mt-1">Paste playlist URL — opens Spotify to play</Text>
                <View className="mt-2">
                  <ModalInput
                    value={spotifyUrl}
                    onChangeText={setSpotifyUrl}
                    placeholder="https://open.spotify.com/playlist/..."
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMusicOption('insight')}
                className={`p-3 rounded-xl border ${musicOption === 'insight' ? 'border-primary bg-primary/10' : 'border-border'}`}
              >
                <Text className="text-foreground">Insight Timer</Text>
                <Text className="text-xs text-muted-foreground mt-1">Paste track URL below, then tap to select</Text>
                <View className="mt-2">
                  <ModalInput
                    value={insightUrl}
                    onChangeText={setInsightUrl}
                    placeholder="https://insighttimer.com/..."
                  />
                </View>
              </TouchableOpacity>
            </View>
          </ModalSection>
          <ModalButtonRow>
            <ModalButton onPress={() => setShowMusicModal(false)} variant="secondary">Close</ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>

      <ModalSurface visible={showManualModal} onRequestClose={() => setShowManualModal(false)}>
        <View className="p-6">
          <ModalTitle>Add manual meditation</ModalTitle>
          <ModalSection>
            <ModalLabel>Minutes</ModalLabel>
            <ModalInput
              value={manualMinutes}
              onChangeText={setManualMinutes}
              placeholder="e.g. 15"
              keyboardType="number-pad"
            />
          </ModalSection>
          <ModalButtonRow>
            <ModalButton onPress={() => setShowManualModal(false)} variant="secondary">Cancel</ModalButton>
            <ModalButton
              onPress={async () => {
                const mins = parseInt(manualMinutes, 10);
                if (!isNaN(mins) && mins > 0) {
                  const today = getTodayKey();
                  await recordMeditationSession(today, mins * 60);
                  setShowManualModal(false);
                }
              }}
              variant="primary"
              disabled={!manualMinutes.trim() || isNaN(parseInt(manualMinutes, 10)) || parseInt(manualMinutes, 10) < 1}
            >
              Add
            </ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
    </View>
  );
}
