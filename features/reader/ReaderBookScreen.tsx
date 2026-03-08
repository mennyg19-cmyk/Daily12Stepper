import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Bookmark, Check } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { LoadingView } from '@/components/common/LoadingView';
import {
  ModalLabel,
  ModalInput,
  ModalSection,
  ModalButton,
  ModalButtonRow,
  ModalTitle,
} from '@/components/ModalContent';
import { ModalSurface } from '@/components/ModalSurface';
import { useIconColors } from '@/lib/iconTheme';
import {
  getBook,
  getBookmarks,
  addBookmark,
  deleteBookmark,
  getLastPosition,
  savePosition,
  updateBookmarkPosition,
} from './database';
import type { ReaderBook, ReaderBookmark } from './database';
import { getExtraTools } from '@/features/extra-tools/database';
import { logger } from '@/lib/logger';
import { getTodayKey } from '@/utils/date';
import { startStepworkSession, endStepworkSession } from '@/features/steps/database';

const SAVE_DEBOUNCE_MS = 1500;

export function ReaderBookScreen() {
  const params = useLocalSearchParams<{ bookId: string; fromStep?: string; bookmarkId?: string }>();
  const router = useRouter();
  const fromStep = params.fromStep ? parseInt(params.fromStep, 10) : null;
  const bookmarkId = params.bookmarkId ?? null;
  const iconColors = useIconColors();
  const [book, setBook] = useState<ReaderBook | null>(null);
  const [bookmarks, setBookmarks] = useState<ReaderBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedScrollY, setSavedScrollY] = useState(0);
  const [currentScrollY, setCurrentScrollY] = useState(0);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [showBookmarkPrompt, setShowBookmarkPrompt] = useState(false);
  const [bookmarkLabel, setBookmarkLabel] = useState('');
  const [linkedToolId, setLinkedToolId] = useState<string | null>(null);
  const [isAutoBookmark, setIsAutoBookmark] = useState(false);
  const [extraTools, setExtraTools] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepworkSessionIdRef = useRef<string | null>(null);
  const stepworkStartTimeRef = useRef<number>(0);

  // When opened from a step: start stepwork session, end on unmount
  useEffect(() => {
    if (!fromStep || !Number.isFinite(fromStep)) return;
    const today = getTodayKey();
    let mounted = true;
    (async () => {
      try {
        const id = await startStepworkSession(fromStep, today);
        if (mounted) {
          stepworkSessionIdRef.current = id;
          stepworkStartTimeRef.current = Math.floor(Date.now() / 1000);
        }
      } catch {
        // Ignore
      }
    })();
    return () => {
      mounted = false;
      if (stepworkSessionIdRef.current) {
        const now = Math.floor(Date.now() / 1000);
        const duration = now - stepworkStartTimeRef.current;
        endStepworkSession(stepworkSessionIdRef.current, duration).catch(() => {});
        stepworkSessionIdRef.current = null;
      }
    };
  }, [fromStep]);

  useEffect(() => {
    (async () => {
      try {
        const b = await getBook(params.bookId);
        setBook(b ?? null);
        if (b) {
          const [bmList, pos, tools] = await Promise.all([
            getBookmarks(b.id),
            getLastPosition(b.id),
            getExtraTools(),
          ]);
          setBookmarks(bmList);
          setExtraTools(tools.map((t) => ({ id: t.id, name: t.name })));
          // If opened with bookmarkId, scroll to that bookmark
          if (bookmarkId) {
            const targetBm = bmList.find((bm) => bm.id === bookmarkId);
            if (targetBm) {
              const scrollY = parseFloat(targetBm.pageOrPosition);
              if (!isNaN(scrollY)) {
                setSavedScrollY(scrollY);
                setCurrentScrollY(scrollY);
              }
            }
          } else if (bmList.length > 0) {
            setShowBookmarkPrompt(true);
            const scrollY = pos ? parseFloat(pos) : 0;
            if (!isNaN(scrollY)) {
              setSavedScrollY(scrollY);
              setCurrentScrollY(scrollY);
            }
          } else {
            const scrollY = pos ? parseFloat(pos) : 0;
            if (!isNaN(scrollY)) {
              setSavedScrollY(scrollY);
              setCurrentScrollY(scrollY);
            }
          }
        }
      } catch (err) {
        logger.error('Failed to load book:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.bookId, bookmarkId]);

  const autoBookmarkIdRef = React.useRef<string | null>(null);
  autoBookmarkIdRef.current = bookmarks.find((bm) => bm.isAutoBookmark)?.id ?? null;

  const handleSavePosition = useCallback(
    (scrollY: number) => {
      if (!book) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        savePosition(book.id, String(scrollY)).catch(() => {});
        const autoId = autoBookmarkIdRef.current;
        if (autoId) {
          updateBookmarkPosition(autoId, String(scrollY)).catch(() => {});
          setBookmarks((prev) =>
            prev.map((bm) =>
              bm.isAutoBookmark ? { ...bm, pageOrPosition: String(scrollY) } : bm
            )
          );
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [book]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const getInjectedJS = useCallback(() => {
    return `
      (function() {
        var restored = false;
        var savedY = ${savedScrollY};
        function tryRestore() {
          if (!restored && savedY > 0 && document.body.scrollHeight > savedY) {
            window.scrollTo(0, savedY);
            restored = true;
          }
        }
        window.addEventListener('load', function() {
          setTimeout(tryRestore, 500);
          setTimeout(tryRestore, 1500);
          setTimeout(tryRestore, 3000);
        });
        var lastReported = 0;
        window.addEventListener('scroll', function() {
          var y = window.scrollY || document.documentElement.scrollTop || 0;
          if (Math.abs(y - lastReported) > 50) {
            lastReported = y;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scroll', y: y }));
          }
        }, { passive: true });
        true;
      })();
    `;
  }, [savedScrollY]);

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'scroll' && typeof data.y === 'number') {
          setCurrentScrollY(data.y);
          handleSavePosition(data.y);
        } else if (data.type === 'scrollPosition' && typeof data.y === 'number') {
          setCurrentScrollY(data.y);
        }
      } catch {
        // Ignore
      }
    },
    [handleSavePosition]
  );

  const webViewSource = book
    ? book.type === 'url'
      ? { uri: book.uri }
      : { uri: book.uri.startsWith('file://') ? book.uri : `file://${book.uri.replace(/^\/+/, '')}` }
    : undefined;

  const handleAddBookmark = async () => {
    if (!book) return;
    const label = bookmarkLabel.trim() || `Bookmark ${bookmarks.length + 1}`;
    const pos = String(currentScrollY || savedScrollY);
    setSubmitting(true);
    try {
      const bm = await addBookmark(book.id, label, pos, linkedToolId, null, isAutoBookmark);
      setBookmarks((prev) => [...prev, bm]);
      setShowBookmarkModal(false);
      setBookmarkLabel('');
      setLinkedToolId(null);
      setIsAutoBookmark(false);
    } catch {
      Alert.alert('Failed to add bookmark');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBookmark = (bm: ReaderBookmark) => {
    Alert.alert('Remove bookmark', `Remove "${bm.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteBookmark(bm.id);
          setBookmarks((prev) => prev.filter((b) => b.id !== bm.id));
        },
      },
    ]);
  };

  const goToBookmark = (bm: ReaderBookmark) => {
    const y = parseFloat(bm.pageOrPosition);
    if (!isNaN(y) && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `window.scrollTo(0, ${y}); true;`
      );
    }
    setSavedScrollY(y);
    setCurrentScrollY(y);
    setShowBookmarkModal(false);
    setShowBookmarkPrompt(false);
    if (bm.linkedToolId) {
      router.push('/extra-tools');
    }
  };

  const handleResume = () => {
    setShowBookmarkPrompt(false);
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Reader" showBack />
        <LoadingView />
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Reader" showBack />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-foreground text-lg font-bold mb-2">Book not found</Text>
          <Text className="text-muted-foreground text-center text-sm">
            This book may have been removed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    if (fromStep != null && Number.isFinite(fromStep)) {
      router.replace(`/steps/${fromStep}`);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader
        title={book.title}
        showBack
        onBackPress={handleBack}
        rightSlot={
          <View className="flex-row items-center gap-1">
            {fromStep != null && Number.isFinite(fromStep) ? (
              <TouchableOpacity
                onPress={handleBack}
                className="flex-row items-center gap-2 bg-primary px-4 py-2 rounded-lg"
              >
                <Check size={18} color={iconColors.primaryForeground} />
                <Text className="text-primary-foreground font-semibold">Done</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  setBookmarkLabel('');
                  setShowBookmarkModal(true);
                  webViewRef.current?.injectJavaScript(
                    `window.ReactNativeWebView.postMessage(JSON.stringify({type:'scrollPosition',y:window.scrollY||document.documentElement.scrollTop||0}));true;`
                  );
                }}
                className="p-2"
              >
                <Bookmark size={24} color={iconColors.primary} />
              </TouchableOpacity>
            )}
          </View>
        }
      />
      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-foreground text-lg font-bold mb-2">Could not load</Text>
          <Text className="text-muted-foreground text-center text-sm mb-4">{error}</Text>
          <TouchableOpacity
            onPress={() => setError(null)}
            className="bg-primary rounded-xl py-2.5 px-6"
          >
            <Text className="text-primary-foreground font-semibold text-sm">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={webViewSource}
          style={{ flex: 1 }}
          injectedJavaScript={getInjectedJS()}
          onMessage={handleMessage}
          onError={(e) => setError(e.nativeEvent.description || 'Failed to load')}
          onHttpError={(e) =>
            setError(
              `Error ${e.nativeEvent.statusCode ?? 'unknown'}. ${e.nativeEvent.description || ''}`
            )
          }
          startInLoadingState
          renderLoading={() => (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.05)',
              }}
            >
              <LoadingView message={`Loading ${book.title}...`} />
            </View>
          )}
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          originWhitelist={['*']}
          javaScriptEnabled
        />
      )}

      {/* Bookmark prompt — when opening book with bookmarks */}
      <ModalSurface
        visible={showBookmarkPrompt}
        onRequestClose={handleResume}
      >
        <View className="p-6">
          <ModalTitle>Where would you like to go?</ModalTitle>
          <Text className="text-sm text-muted-foreground mb-4">
            Resume where you left off or jump to a bookmark.
          </Text>
          <TouchableOpacity
            onPress={handleResume}
            className="rounded-xl py-3 bg-primary mb-2"
          >
            <Text className="text-primary-foreground font-semibold text-center">Resume where I left off</Text>
          </TouchableOpacity>
          {bookmarks.map((bm) => (
            <TouchableOpacity
              key={bm.id}
              onPress={() => goToBookmark(bm)}
              className="rounded-xl py-3 border border-border mb-2"
            >
              <Text className="text-foreground font-medium text-center">{bm.label}</Text>
              {bm.isAutoBookmark && (
                <Text className="text-xs text-muted-foreground text-center">Auto-updates as you read</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ModalSurface>

      {/* Bookmark modal */}
      <ModalSurface
        visible={showBookmarkModal}
        onRequestClose={() => setShowBookmarkModal(false)}
        position="bottom"
        animationType="slide"
      >
        <View className="p-6 pb-8">
            <ModalTitle>Add bookmark</ModalTitle>
            <Text className="text-sm text-muted-foreground mb-4">
              Saves your current location in the book.
            </Text>
            <ModalSection>
              <ModalLabel>Bookmark name</ModalLabel>
              <ModalInput
                value={bookmarkLabel}
                onChangeText={setBookmarkLabel}
                placeholder="e.g. Step 1, A page a day"
              />
            </ModalSection>
            <TouchableOpacity
              onPress={() => setIsAutoBookmark(!isAutoBookmark)}
              className="flex-row items-center gap-2 py-2"
            >
              <View
                className={`w-5 h-5 rounded border-2 items-center justify-center ${
                  isAutoBookmark ? 'bg-primary border-primary' : 'border-border'
                }`}
              >
                {isAutoBookmark && <Check size={14} color={iconColors.primaryForeground} />}
              </View>
              <Text className="text-sm text-foreground">Auto-update as I read</Text>
            </TouchableOpacity>
            <Text className="text-xs text-muted-foreground mb-2">
              When on, this bookmark moves to your current position as you scroll (e.g. &quot;A page a day&quot;).
            </Text>
            {extraTools.length > 0 && (
              <ModalSection>
                <ModalLabel>Link to extra tool (optional)</ModalLabel>
                <View className="gap-2">
                  <TouchableOpacity
                    onPress={() => setLinkedToolId(null)}
                    className={`rounded-lg p-3 border ${
                      !linkedToolId ? 'bg-primary border-primary' : 'border-border'
                    }`}
                  >
                    <Text
                      className={!linkedToolId ? 'text-primary-foreground font-medium' : 'text-foreground'}
                    >
                      None
                    </Text>
                  </TouchableOpacity>
                  {extraTools.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setLinkedToolId(t.id)}
                      className={`rounded-lg p-3 border ${
                        linkedToolId === t.id ? 'bg-primary border-primary' : 'border-border'
                      }`}
                    >
                      <Text
                        className={
                          linkedToolId === t.id ? 'text-primary-foreground font-medium' : 'text-foreground'
                        }
                      >
                        {t.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ModalSection>
            )}
            <ModalButtonRow className="mt-4">
              <ModalButton onPress={() => setShowBookmarkModal(false)} variant="secondary">
                Cancel
              </ModalButton>
              <ModalButton
                onPress={handleAddBookmark}
                variant="primary"
                disabled={submitting}
                loading={submitting}
              >
                Add
              </ModalButton>
            </ModalButtonRow>
            {bookmarks.length > 0 && (
              <>
                <Text className="text-base font-semibold text-foreground mt-6 mb-2">
                  Your bookmarks
                </Text>
                <View className="gap-2">
                  {bookmarks.map((bm) => (
                    <View
                      key={bm.id}
                      className="rounded-lg p-3 border border-border flex-row items-center justify-between"
                    >
                      <TouchableOpacity
                        onPress={() => goToBookmark(bm)}
                        className="flex-1"
                        activeOpacity={0.7}
                      >
                        <Text className="text-foreground font-medium">{bm.label}</Text>
                        {(bm.isAutoBookmark || bm.linkedToolId) && (
                          <Text className="text-xs text-muted-foreground">
                            {bm.isAutoBookmark ? 'Auto-updates' : 'Linked to tool'}
                          </Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteBookmark(bm)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text className="text-destructive text-sm">Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
      </ModalSurface>
    </SafeAreaView>
  );
}
