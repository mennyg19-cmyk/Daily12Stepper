/**
 * Reusable "Link to bookmark" component for steps.
 * Shows list of books + bookmarks; user can link one to the step or open a linked bookmark.
 * Modal: bottom sheet style, large, keyboard-aware.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { Bookmark, BookOpen, ExternalLink, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useIconColors } from '@/lib/iconTheme';
import {
  getAllBookmarksWithBooks,
  getBookmarksForStep,
  linkBookmarkToStep,
  unlinkBookmarkFromStep,
} from '@/features/reader/database';
import type { ReaderBookmarkWithBook } from '@/features/reader/database';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalTitle, ModalButton, ModalButtonRow } from '@/components/ModalContent';

interface StepBookmarkPickerProps {
  stepNumber: number;
  onStartTimer?: () => void;
}

export function StepBookmarkPicker({ stepNumber, onStartTimer }: StepBookmarkPickerProps) {
  const router = useRouter();
  const iconColors = useIconColors();
  const { height: windowHeight } = useWindowDimensions();
  const [showPicker, setShowPicker] = useState(false);
  const [allBookmarks, setAllBookmarks] = useState<ReaderBookmarkWithBook[]>([]);
  const [linkedBookmarks, setLinkedBookmarks] = useState<ReaderBookmarkWithBook[]>([]);

  const load = useCallback(async () => {
    const [all, linked] = await Promise.all([
      getAllBookmarksWithBooks(),
      getBookmarksForStep(stepNumber),
    ]);
    setAllBookmarks(all);
    setLinkedBookmarks(linked);
  }, [stepNumber]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLink = async (bm: ReaderBookmarkWithBook) => {
    await linkBookmarkToStep(bm.id, stepNumber);
    load();
    setShowPicker(false);
  };

  const handleUnlink = (bm: ReaderBookmarkWithBook) => {
    Alert.alert('Unlink bookmark', `Unlink "${bm.label}" from Step ${stepNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlink',
        style: 'destructive',
        onPress: async () => {
          await unlinkBookmarkFromStep(bm.id);
          load();
        },
      },
    ]);
  };

  const handleOpenBookmark = (bm: ReaderBookmarkWithBook) => {
    setShowPicker(false);
    router.push(`/reader/${bm.bookId}?fromStep=${stepNumber}&bookmarkId=${bm.id}`);
  };

  const modalHeight = Math.min(windowHeight * 0.85, 560);

  const renderBookmarkItem = ({ item: bm }: { item: ReaderBookmarkWithBook }) => {
    const isLinked = linkedBookmarks.some((l) => l.id === bm.id);
    return (
      <TouchableOpacity
        onPress={() => handleLink(bm)}
        disabled={isLinked}
        className={`rounded-xl p-4 border flex-row items-center justify-between mb-2 ${
          isLinked ? 'border-primary bg-primary/10 opacity-75' : 'border-border'
        }`}
      >
        <View className="flex-1">
          <Text className="text-base font-medium text-foreground">{bm.label}</Text>
          <Text className="text-sm text-muted-foreground mt-0.5">{bm.bookTitle}</Text>
        </View>
        {isLinked ? (
          <Text className="text-primary text-sm font-semibold ml-2">Linked</Text>
        ) : (
          <Text className="text-muted-foreground text-sm ml-2">Tap to link</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-muted-foreground mb-2">Daily reading</Text>
      {linkedBookmarks.length > 0 ? (
        <View className="gap-2">
          {linkedBookmarks.map((bm) => (
            <View
              key={bm.id}
              className="flex-row items-center justify-between p-3 rounded-xl border border-border bg-card"
            >
              <TouchableOpacity
                onPress={() => handleOpenBookmark(bm)}
                onFocus={onStartTimer}
                className="flex-1 flex-row items-center gap-2"
              >
                <BookOpen size={18} color={iconColors.primary} />
                <View>
                  <Text className="text-foreground font-medium">{bm.label}</Text>
                  <Text className="text-xs text-muted-foreground">{bm.bookTitle}</Text>
                </View>
                <ExternalLink size={16} color={iconColors.muted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleUnlink(bm)} className="p-2">
                <Trash2 size={18} color={iconColors.destructive} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        onFocus={onStartTimer}
        className="py-3 rounded-xl border border-dashed border-border items-center flex-row justify-center gap-2"
      >
        <Bookmark size={18} color={iconColors.primary} />
        <Text className="text-primary font-semibold">
          {linkedBookmarks.length > 0 ? 'Link another bookmark' : 'Link to bookmark'}
        </Text>
      </TouchableOpacity>

      <ModalSurface
        visible={showPicker}
        onRequestClose={() => setShowPicker(false)}
        position="bottom"
        animationType="slide"
        noScroll
      >
        <View style={[styles.modalContent, { height: modalHeight }]}>
          <View className="px-6 pt-6 pb-4">
            <ModalTitle>Link bookmark to Step {stepNumber}</ModalTitle>
            <Text className="text-base text-muted-foreground mt-2">
              Pick a bookmark to read daily. Reading time will count as stepwork.
            </Text>
          </View>
          {allBookmarks.length === 0 ? (
            <View className="flex-1 px-6 py-8 justify-center">
              <Text className="text-muted-foreground text-base">
                No bookmarks yet. Add a book and create bookmarks in the Reader.
              </Text>
            </View>
          ) : (
            <View style={styles.listWrapper}>
              <FlatList
                data={allBookmarks}
                keyExtractor={(item) => item.id}
                renderItem={renderBookmarkItem}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}
          <View className="px-6 pb-6 pt-4 border-t border-border">
            <ModalButton onPress={() => setShowPicker(false)} variant="secondary">
              Close
            </ModalButton>
          </View>
        </View>
      </ModalSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    width: '100%',
  },
  listWrapper: {
    flex: 1,
  },
});
