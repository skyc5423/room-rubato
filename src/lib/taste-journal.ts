export type ObservationChoice = 'a' | 'b' | 'both' | 'unsure';
export interface JournalEntry {
  lessonId: string;
  version: number;
  before?: ObservationChoice;
  after?: ObservationChoice;
  beforeSetting?: number;
  afterSetting?: number;
  memo: string;
  bookmarked: boolean;
  completedAt?: string;
  updatedAt: string;
}
export interface TasteJournal { version: 1; entries: Record<string, JournalEntry> }
export const emptyJournal = (): TasteJournal => ({ version: 1, entries: {} });
export const journalKey = (owner: string) => `rubato_taste_journal_v1:${owner}`;
export function parseJournal(raw: string | null): TasteJournal {
  if (!raw) return emptyJournal();
  try {
    const value = JSON.parse(raw);
    if (value.version !== 1 || !value.entries || typeof value.entries !== 'object') return emptyJournal();
    const entries: Record<string, JournalEntry> = {};
    const choices = new Set(['a', 'b', 'both', 'unsure']);
    for (const [key, entry] of Object.entries(value.entries)) {
      const e = entry as JournalEntry;
      if (!e || e.lessonId !== key || typeof e.memo !== 'string' || typeof e.updatedAt !== 'string' || typeof e.version !== 'number') continue;
      entries[key] = { ...e, before: choices.has(e.before!) ? e.before : undefined, after: choices.has(e.after!) ? e.after : undefined, memo: e.memo.slice(0, 1500), bookmarked: e.bookmarked === true };
    }
    return { version: 1, entries };
  } catch { return emptyJournal(); }
}
export function updateJournal(journal: TasteJournal, lessonId: string, version: number, patch: Partial<JournalEntry>, now = new Date().toISOString()): TasteJournal {
  const previous: Partial<JournalEntry> = journal.entries[lessonId] || {};
  const entry = { memo: '', bookmarked: false, ...previous, ...patch, lessonId, version, updatedAt: now };
  return { version: 1, entries: { ...journal.entries, [lessonId]: entry } };
}
export function suggestNext(ids: string[], journal: TasteJournal): string | undefined {
  return ids.find(id => !journal.entries[id]?.completedAt);
}
