import { CURRENT_SCHEMA_VERSION, type Session } from "./types";

const INDEX_KEY = "pokerpot:index";
const sessionKey = (id: string) => `pokerpot:session:${id}`;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readIndex(): string[] {
  if (!isBrowser()) return [];
  return safeParse<string[]>(localStorage.getItem(INDEX_KEY)) ?? [];
}

function writeIndex(ids: string[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

// --- External store plumbing for useSyncExternalStore ---

const listeners = new Set<() => void>();

function emit(): void {
  sessionCache.clear();
  listSnapshotRaw = null;
  for (const l of listeners) l();
}

export function subscribeStorage(listener: () => void): () => void {
  listeners.add(listener);
  const onStorageEvent = () => {
    sessionCache.clear();
    listSnapshotRaw = null;
    listener();
  };
  if (isBrowser()) {
    window.addEventListener("storage", onStorageEvent);
  }
  return () => {
    listeners.delete(listener);
    if (isBrowser()) {
      window.removeEventListener("storage", onStorageEvent);
    }
  };
}

// --- Raw CRUD ---

export function getSession(id: string): Session | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(sessionKey(id));
  const parsed = safeParse<Session>(raw);
  if (!parsed) return null;
  if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) return null;
  return parsed;
}

export function listSessions(): Session[] {
  return readIndex()
    .map((id) => getSession(id))
    .filter((s): s is Session => s !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveSession(session: Session): void {
  if (!isBrowser()) return;
  localStorage.setItem(sessionKey(session.id), JSON.stringify(session));
  const ids = readIndex();
  if (!ids.includes(session.id)) {
    writeIndex([session.id, ...ids]);
  }
  emit();
}

export function deleteSession(id: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(sessionKey(id));
  writeIndex(readIndex().filter((x) => x !== id));
  emit();
}

export function exportSessionJSON(session: Session): string {
  return JSON.stringify(session, null, 2);
}

export function importSessionJSON(raw: string): Session | null {
  const parsed = safeParse<Session>(raw);
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) return null;
  if (!parsed.id || !Array.isArray(parsed.players) || !Array.isArray(parsed.events)) {
    return null;
  }
  return parsed;
}

// --- Cached snapshots for useSyncExternalStore ---
// These MUST return stable references between calls when the underlying data
// is unchanged, otherwise useSyncExternalStore loops forever.

const sessionCache = new Map<string, { raw: string | null; session: Session | null }>();

export function getSessionSnapshot(id: string): Session | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(sessionKey(id));
  const cached = sessionCache.get(id);
  if (cached && cached.raw === raw) return cached.session;
  const session = getSession(id);
  sessionCache.set(id, { raw, session });
  return session;
}

let listSnapshotRaw: string | null = null;
let listSnapshot: Session[] = [];

export function getSessionsSnapshot(): Session[] {
  if (!isBrowser()) return listSnapshot;
  const ids = readIndex();
  const raws = ids.map((id) => localStorage.getItem(sessionKey(id)));
  const combined = `${ids.join(",")}|${raws.join("|")}`;
  if (combined === listSnapshotRaw) return listSnapshot;
  listSnapshotRaw = combined;
  listSnapshot = listSessions();
  return listSnapshot;
}

const EMPTY_SESSIONS: Session[] = [];
export const getServerSessionsSnapshot = (): Session[] => EMPTY_SESSIONS;
export const getServerSessionSnapshot = (): Session | null => null;
