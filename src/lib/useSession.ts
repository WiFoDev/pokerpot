"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSession, saveSession } from "./storage";
import type { Session } from "./types";

type State = {
  session: Session | null;
  loaded: boolean;
  savedAt: number | null;
};

export function useSession(id: string | null) {
  const [state, setState] = useState<State>({
    session: null,
    loaded: false,
    savedAt: null,
  });
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    if (!id) {
      setState({ session: null, loaded: true, savedAt: null });
      return;
    }
    lastId.current = id;
    const loaded = getSession(id);
    setState({ session: loaded, loaded: true, savedAt: loaded ? Date.now() : null });
  }, [id]);

  const update = useCallback(
    (mutator: (s: Session) => Session) => {
      setState((prev) => {
        if (!prev.session) return prev;
        const next = mutator(prev.session);
        saveSession(next);
        return { session: next, loaded: true, savedAt: Date.now() };
      });
    },
    [],
  );

  const replace = useCallback((s: Session) => {
    saveSession(s);
    setState({ session: s, loaded: true, savedAt: Date.now() });
  }, []);

  return { ...state, update, replace };
}
