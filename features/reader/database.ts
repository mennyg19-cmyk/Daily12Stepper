import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import * as FileSystem from 'expo-file-system/legacy';

export interface ReaderBook {
  id: string;
  title: string;
  uri: string;
  type: 'url' | 'local';
}

export interface ReaderBookmark {
  id: string;
  bookId: string;
  label: string;
  pageOrPosition: string;
  linkedToolId: string | null;
  linkedStepNumber: number | null;
  isAutoBookmark: boolean;
}

export interface ReaderBookmarkWithBook extends ReaderBookmark {
  bookTitle: string;
}

export async function getBooks(): Promise<ReaderBook[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT id, title, uri, type FROM reader_books ORDER BY title ASC'
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    uri: r.uri,
    type: r.type as 'url' | 'local',
  }));
}

export async function addBookFromUri(
  title: string,
  uri: string,
  type: 'url' | 'local'
): Promise<ReaderBook> {
  const db = await getDatabase();
  const id = `book_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  let finalUri = uri;
  if (type === 'local') {
    const ext = uri.split('.').pop()?.toLowerCase() || 'pdf';
    const dest = `${FileSystem.documentDirectory}reader_${id}.${ext}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    finalUri = dest;
  }

  await db.runAsync(
    'INSERT INTO reader_books (id, title, uri, type) VALUES (?, ?, ?, ?)',
    [id, title.trim(), finalUri, type]
  );

  const rows = await db.getAllAsync<any>('SELECT * FROM reader_books WHERE id = ?', [id]);
  if (!rows[0]) throw new Error('Failed to create book');
  return {
    id: rows[0].id,
    title: rows[0].title,
    uri: rows[0].uri,
    type: rows[0].type,
  };
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ uri: string; type: string }>(
    'SELECT uri, type FROM reader_books WHERE id = ?',
    [id]
  );
  if (row?.type === 'local' && row.uri) {
    try {
      await FileSystem.deleteAsync(row.uri, { idempotent: true });
    } catch {
      // Ignore file delete errors
    }
  }
  await db.runAsync('DELETE FROM reader_books WHERE id = ?', [id]);
}

export async function getBook(id: string): Promise<ReaderBook | null> {
  if (!(await isSQLiteAvailable())) return null;
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM reader_books WHERE id = ?', [id]);
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    uri: row.uri,
    type: row.type,
  };
}

export async function getBookmarks(bookId: string): Promise<ReaderBookmark[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(reader_bookmarks)");
  const hasAuto = cols.some((c) => c.name === 'is_auto_bookmark');
  const rows = await db.getAllAsync<any>(
    'SELECT id, book_id, label, page_or_position, linked_tool_id, linked_step_number' +
    (hasAuto ? ', is_auto_bookmark' : '') +
    ' FROM reader_bookmarks WHERE book_id = ? ORDER BY label ASC',
    [bookId]
  );
  return rows.map((r) => ({
    id: r.id,
    bookId: r.book_id,
    label: r.label,
    pageOrPosition: r.page_or_position,
    linkedToolId: r.linked_tool_id,
    linkedStepNumber: r.linked_step_number != null ? r.linked_step_number : null,
    isAutoBookmark: hasAuto ? (r.is_auto_bookmark === 1) : false,
  }));
}

export async function getAllBookmarksWithBooks(): Promise<ReaderBookmarkWithBook[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(reader_bookmarks)");
  const hasAuto = cols.some((c) => c.name === 'is_auto_bookmark');
  const rows = await db.getAllAsync<any>(
    `SELECT bm.id, bm.book_id, bm.label, bm.page_or_position, bm.linked_tool_id, bm.linked_step_number${hasAuto ? ', bm.is_auto_bookmark' : ''}, b.title as book_title
     FROM reader_bookmarks bm
     JOIN reader_books b ON b.id = bm.book_id
     ORDER BY b.title ASC, bm.label ASC`
  );
  return rows.map((r) => ({
    id: r.id,
    bookId: r.book_id,
    label: r.label,
    pageOrPosition: r.page_or_position,
    linkedToolId: r.linked_tool_id,
    linkedStepNumber: r.linked_step_number != null ? r.linked_step_number : null,
    isAutoBookmark: hasAuto ? (r.is_auto_bookmark === 1) : false,
    bookTitle: r.book_title ?? '',
  }));
}

export async function getBookmarksForStep(stepNumber: number): Promise<ReaderBookmarkWithBook[]> {
  if (!(await isSQLiteAvailable())) return [];
  const db = await getDatabase();
  const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(reader_bookmarks)");
  const hasAuto = cols.some((c) => c.name === 'is_auto_bookmark');
  const rows = await db.getAllAsync<any>(
    `SELECT bm.id, bm.book_id, bm.label, bm.page_or_position, bm.linked_tool_id, bm.linked_step_number${hasAuto ? ', bm.is_auto_bookmark' : ''}, b.title as book_title
     FROM reader_bookmarks bm
     JOIN reader_books b ON b.id = bm.book_id
     WHERE bm.linked_step_number = ?
     ORDER BY bm.label ASC`,
    [stepNumber]
  );
  return rows.map((r) => ({
    id: r.id,
    bookId: r.book_id,
    label: r.label,
    pageOrPosition: r.page_or_position,
    linkedToolId: r.linked_tool_id,
    linkedStepNumber: r.linked_step_number,
    isAutoBookmark: hasAuto ? (r.is_auto_bookmark === 1) : false,
    bookTitle: r.book_title ?? '',
  }));
}

export async function linkBookmarkToStep(bookmarkId: string, stepNumber: number | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE reader_bookmarks SET linked_step_number = ?, linked_tool_id = NULL WHERE id = ?',
    [stepNumber, bookmarkId]
  );
}

export async function unlinkBookmarkFromStep(bookmarkId: string): Promise<void> {
  await linkBookmarkToStep(bookmarkId, null);
}

export async function addBookmark(
  bookId: string,
  label: string,
  pageOrPosition: string,
  linkedToolId: string | null = null,
  linkedStepNumber: number | null = null,
  isAutoBookmark: boolean = false
): Promise<ReaderBookmark> {
  const db = await getDatabase();
  const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(reader_bookmarks)");
  const hasAuto = cols.some((c) => c.name === 'is_auto_bookmark');
  const id = `bm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  if (hasAuto) {
    await db.runAsync(
      'INSERT INTO reader_bookmarks (id, book_id, label, page_or_position, linked_tool_id, linked_step_number, is_auto_bookmark) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, bookId, label.trim(), pageOrPosition, linkedToolId, linkedStepNumber, isAutoBookmark ? 1 : 0]
    );
  } else {
    await db.runAsync(
      'INSERT INTO reader_bookmarks (id, book_id, label, page_or_position, linked_tool_id, linked_step_number) VALUES (?, ?, ?, ?, ?, ?)',
      [id, bookId, label.trim(), pageOrPosition, linkedToolId, linkedStepNumber]
    );
  }
  const rows = await db.getAllAsync<any>('SELECT * FROM reader_bookmarks WHERE id = ?', [id]);
  if (!rows[0]) throw new Error('Failed to create bookmark');
  return {
    id: rows[0].id,
    bookId: rows[0].book_id,
    label: rows[0].label,
    pageOrPosition: rows[0].page_or_position,
    linkedToolId: rows[0].linked_tool_id,
    linkedStepNumber: rows[0].linked_step_number != null ? rows[0].linked_step_number : null,
    isAutoBookmark: hasAuto ? (rows[0].is_auto_bookmark === 1) : false,
  };
}

export async function updateBookmarkPosition(bookmarkId: string, pageOrPosition: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE reader_bookmarks SET page_or_position = ? WHERE id = ?',
    [pageOrPosition, bookmarkId]
  );
}

export async function deleteBookmark(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM reader_bookmarks WHERE id = ?', [id]);
}

export async function getLastPosition(bookId: string): Promise<string | null> {
  if (!(await isSQLiteAvailable())) return null;
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ last_position: string }>(
    'SELECT last_position FROM reader_positions WHERE book_id = ?',
    [bookId]
  );
  return row?.last_position ?? null;
}

export async function savePosition(bookId: string, position: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO reader_positions (book_id, last_position) VALUES (?, ?)',
    [bookId, position]
  );
}
