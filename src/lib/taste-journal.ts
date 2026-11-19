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
    const setting = (value: unknown): number | undefined => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? value : undefined;
    const choices = new Set(['a', 'b', 'both', 'unsure']);
    for (const [key, entry] of Object.entries(value.entries)) {
      const e = entry as JournalEntry;
      if (!e || e.lessonId !== key || typeof e.memo !== 'string' || typeof e.updatedAt !== 'string' || typeof e.version !== 'number') continue;
      entries[key] = { ...e, before: choices.has(e.before!) ? e.before : undefined, after: choices.has(e.after!) ? e.after : undefined, beforeSetting: setting(e.beforeSetting), afterSetting: setting(e.afterSetting), memo: e.memo.slice(0, 1500), bookmarked: e.bookmarked === true };
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

/** Mutation guard: display parsing may salvage records, but writes must not erase rejected data. */
export function parseJournalForWrite(raw:string|null):TasteJournal {
  if(raw===null)return emptyJournal();
  let value:unknown;
  try{value=JSON.parse(raw);}catch{throw new Error('Unreadable journal');}
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid journal');
  const data=value as Record<string,unknown>;
  if(Object.keys(data).some(key=>key!=='version'&&key!=='entries')||data.version!==1||!data.entries||typeof data.entries!=='object'||Array.isArray(data.entries))throw new Error('Unsupported journal');
  for(const [key,entry] of Object.entries(data.entries)){
    if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new Error('Invalid journal entry');
    const e=entry as Record<string,unknown>;
    if(e.lessonId!==key||typeof e.memo!=='string'||e.memo.length>1500||typeof e.updatedAt!=='string'||typeof e.version!=='number'||!Number.isFinite(e.version))throw new Error('Invalid journal entry');
    // Display parsing may hide unsupported values; mutation must preserve their raw
    // evidence rather than normalize another entry while saving an unrelated one.
    for(const field of ['before','after']){
      const choice=e[field];
      if(choice!==undefined&&(typeof choice!=='string'||!['a','b','both','unsure'].includes(choice)))throw new Error('Invalid journal choice');
    }
    for(const field of ['beforeSetting','afterSetting']){
      const setting=e[field];
      if(setting!==undefined&&(typeof setting!=='number'||!Number.isFinite(setting)||setting<0||setting>100))throw new Error('Invalid journal setting');
    }
    // Older records may omit the bookmark entirely. Only that absence can safely
    // default to false; an explicitly stored non-boolean must not be overwritten.
    if(e.bookmarked!==undefined&&typeof e.bookmarked!=='boolean')throw new Error('Invalid journal bookmark');
  }
  return parseJournal(raw);
}
