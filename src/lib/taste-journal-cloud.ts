import type { TasteJournal } from './taste-journal';

export interface JournalCloudRow { state: unknown; revision: string }
export interface JournalCloudWrite { ownerId: string; expectedRevision: string | null; writeId: string; state: TasteJournal }
export interface JournalCloudClient {
  load: (owner: string) => Promise<JournalCloudRow | null>;
  save: (request: JournalCloudWrite) => Promise<{ status: 'saved'; revision: string } | { status: 'conflict' }>;
}
const invalidCloud = () => new Error('서버 기록 형식을 확인하지 못했어요. 브라우저 기록은 그대로 남겨뒀어요.');
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const timestamp = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
};
const entryFields = new Set(['lessonId', 'version', 'before', 'after', 'beforeSetting', 'afterSetting', 'memo', 'bookmarked', 'completedAt', 'updatedAt']);
const choice = new Set(['a', 'b', 'both', 'unsure']);
export function journalFromCloud(row: JournalCloudRow | null): TasteJournal {
  if (!row) return { version: 1, entries: {} };
  // Validate without normalization/truncation. A malformed or newer schema must
  // never silently replace recoverable local notes with partially parsed data.
  const state = row.state;
  if (typeof row.revision !== 'string' || !row.revision.trim() || !record(state) || state.version !== 1 || !record(state.entries) || Object.keys(state).some(k => k !== 'version' && k !== 'entries')) throw invalidCloud();
  if (Object.keys(state.entries).length > 1000) throw invalidCloud();
  for (const [id, entry] of Object.entries(state.entries)) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(id) || !record(entry) || entry.lessonId !== id || Object.keys(entry).some(k => !entryFields.has(k))) throw invalidCloud();
    if (typeof entry.version !== 'number' || !Number.isSafeInteger(entry.version) || entry.version < 1 || typeof entry.memo !== 'string' || entry.memo.length > 1500 || typeof entry.bookmarked !== 'boolean' || !timestamp(entry.updatedAt)) throw invalidCloud();
    for (const key of ['before', 'after']) {
      if (entry[key] !== undefined && (typeof entry[key] !== 'string' || !choice.has(entry[key] as string))) throw invalidCloud();
    }
    for (const key of ['beforeSetting', 'afterSetting']) {
      const value = entry[key];
      if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100)) throw invalidCloud();
    }
    if (entry.completedAt !== undefined && !timestamp(entry.completedAt)) throw invalidCloud();
  }
  // Detach the checked JSON data from the network response; no sanitization.
  return JSON.parse(JSON.stringify(state)) as TasteJournal;
}
