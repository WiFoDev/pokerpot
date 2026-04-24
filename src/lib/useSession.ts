"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getServerSessionSnapshot,
  getServerSessionsSnapshot,
  getSessionSnapshot,
  getSessionsSnapshot,
  saveSession,
  subscribeStorage,
} from "./storage";
import type { Session } from "./types";

const emptySubscribe = () => () => {};
const trueSnapshot = () => true;
const falseSnapshot = () => false;

export function useIsHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, trueSnapshot, falseSnapshot);
}

export function useSessions(): Session[] {
  return useSyncExternalStore(
    subscribeStorage,
    getSessionsSnapshot,
    getServerSessionsSnapshot,
  );
}

export function useSession(id: string | null) {
  const getSnapshot = useCallback(
    () => (id ? getSessionSnapshot(id) : null),
    [id],
  );
  const session = useSyncExternalStore(
    subscribeStorage,
    getSnapshot,
    getServerSessionSnapshot,
  );
  const hydrated = useIsHydrated();

  const update = useCallback(
    (mutator: (s: Session) => Session) => {
      if (!session) return;
      const next = mutator(session);
      saveSession(next);
    },
    [session],
  );

  const replace = useCallback((s: Session) => {
    saveSession(s);
  }, []);

  return {
    session,
    loaded: hydrated,
    savedAt: session?.updatedAt ?? null,
    update,
    replace,
  };
}
