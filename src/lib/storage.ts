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

export function listSessionIds(): string[] {
  return readIndex();
}

export function getSession(id: string): Session | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(sessionKey(id));
  const parsed = safeParse<Session>(raw);
  if (!parsed) return null;
  if (parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    // Future: migrations. For v1 we accept only matching version.
    return null;
  }
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
}

export function deleteSession(id: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(sessionKey(id));
  writeIndex(readIndex().filter((x) => x !== id));
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
