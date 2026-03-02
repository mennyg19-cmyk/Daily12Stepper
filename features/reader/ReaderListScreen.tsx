import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Plus, BookOpen, Trash2, ChevronRight } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  ModalLabel,
  ModalInput,
  ModalSection,
  ModalButton,
  ModalButtonRow,
  ModalTitle,
} from '@/components/ModalContent';
import { ModalSurface } from '@/components/ModalSurface';
import { LoadingView } from '@/components/common/LoadingView';
import { useIconColors } from '@/lib/iconTheme';
import { getBooks, addBookFromUri, deleteBook } from './database';
import type { ReaderBook } from './database';
import { logger } from '@/lib/logger';

export function ReaderListScreen() {
  const router = useRouter();
  const iconColors = useIconColors();
  const [books, setBooks] = useState<ReaderBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<'url' | 'file'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const list = await getBooks();
      setBooks(list);
    } catch (err) {
      logger.error('Failed to load books:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/epub+zip', 'text/html'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const title = titleInput.trim() || asset.name;
      setSubmitting(true);
      const book = await addBookFromUri(title, asset.uri, 'local');
      setBooks((prev) => [...prev, book].sort((a, b) => a.title.localeCompare(b.title)));
      setShowAdd(false);
      setTitleInput('');
      setUrlInput('');
      router.push(`/reader/${book.id}`);
    } catch (e) {
      Alert.alert('Failed to add book', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUrl = async () => {
    const url = urlInput.trim();
    const title = titleInput.trim() || 'Untitled';
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Alert.alert('Invalid URL', 'URL must start with http:// or https://');
      return;
    }
    setSubmitting(true);
    try {
      const book = await addBookFromUri(title, url, 'url');
      setBooks((prev) => [...prev, book].sort((a, b) => a.title.localeCompare(b.title)));
      setShowAdd(false);
      setTitleInput('');
      setUrlInput('');
      router.push(`/reader/${book.id}`);
    } catch (e) {
      Alert.alert('Failed to add book', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (book: ReaderBook) => {
    Alert.alert('Remove book', `Remove "${book.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await deleteBook(book.id);
        setBooks((prev) => prev.filter((b) => b.id !== book.id));
      }},
    ]);
  };

  if (loading) return <LoadingView />;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Reader" rightSlot={<ThemeToggle />} showBack />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 96 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={iconColors.primary} />
        }
      >
        <Text className="text-sm text-muted-foreground mb-4">
          Add PDFs, ebooks, or web pages. Multiple bookmarks per book. Link bookmarks to extra tools.
        </Text>

        <TouchableOpacity
          onPress={() => {
            setShowAdd(true);
            setAddMode('url');
            setUrlInput('');
            setTitleInput('');
          }}
          className="flex-row items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-border mb-4"
        >
          <Plus size={20} color={iconColors.primary} />
          <Text className="text-base font-semibold text-primary">Add book</Text>
        </TouchableOpacity>

        {books.length === 0 ? (
          <View className="rounded-2xl p-6 bg-card border border-border">
            <Text className="text-muted-foreground text-center">
              No books yet. Add a PDF, ebook, or URL above.
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {books.map((book) => (
              <View
                key={book.id}
                className="rounded-xl p-4 bg-card border border-border flex-row items-center justify-between"
              >
                <TouchableOpacity
                  onPress={() => router.push(`/reader/${book.id}`)}
                  className="flex-row items-center flex-1"
                  activeOpacity={0.8}
                >
                  <BookOpen size={24} color={iconColors.primary} />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-semibold text-foreground">{book.title}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {book.type === 'url' ? 'Web' : 'Local'}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={iconColors.muted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(book)} className="p-2">
                  <Trash2 size={18} color={iconColors.destructive} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ModalSurface visible={showAdd} onRequestClose={() => setShowAdd(false)}>
        <View className="p-6">
          <ModalTitle>Add book</ModalTitle>
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={() => setAddMode('url')}
              className={`flex-1 py-2 rounded-lg border ${
                addMode === 'url' ? 'bg-primary border-primary' : 'border-border'
              }`}
            >
              <Text
                className={`text-sm font-medium text-center ${
                  addMode === 'url' ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                URL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAddMode('file')}
              className={`flex-1 py-2 rounded-lg border ${
                addMode === 'file' ? 'bg-primary border-primary' : 'border-border'
              }`}
            >
              <Text
                className={`text-sm font-medium text-center ${
                  addMode === 'file' ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                File
              </Text>
            </TouchableOpacity>
          </View>
          <ModalSection>
            <ModalLabel>Title (optional)</ModalLabel>
            <ModalInput
              value={titleInput}
              onChangeText={setTitleInput}
              placeholder="e.g. Big Book"
            />
          </ModalSection>
          {addMode === 'url' && (
            <ModalSection>
              <ModalLabel>URL</ModalLabel>
              <ModalInput
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="https://..."
                keyboardType="url"
                autoCapitalize="none"
              />
            </ModalSection>
          )}
          <ModalButtonRow className="mt-4">
            <ModalButton onPress={() => setShowAdd(false)} variant="secondary">
              Cancel
            </ModalButton>
            {addMode === 'url' ? (
              <ModalButton
                onPress={handleAddUrl}
                variant="primary"
                disabled={!urlInput.trim() || submitting}
                loading={submitting}
              >
                Add
              </ModalButton>
            ) : (
              <ModalButton
                onPress={handlePickDocument}
                variant="primary"
                disabled={submitting}
                loading={submitting}
              >
                Pick file
              </ModalButton>
            )}
          </ModalButtonRow>
        </View>
      </ModalSurface>
    </SafeAreaView>
  );
}
