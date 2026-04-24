"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDateTime, formatPEN } from "@/lib/format";
import { importSessionJSON, saveSession } from "@/lib/storage";
import type { Session } from "@/lib/types";
import { useIsHydrated, useSessions } from "@/lib/useSession";

export default function Home() {
  const sessions = useSessions();
  const hydrated = useIsHydrated();
  const [importOpen, setImportOpen] = useState(false);

  if (!hydrated) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500 text-sm">Cargando…</p>
      </main>
    );
  }

  const active = sessions.filter((s) => s.status === "active");
  const settled = sessions.filter((s) => s.status === "settled");

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 pb-32 max-w-xl mx-auto w-full">
      <header className="pt-4">
        <h1 className="text-3xl font-bold">PokerPot</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Lleva la cuenta de buy-ins y reparte la plata al final.
        </p>
      </header>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center">
          <p className="text-zinc-400">Todavía no tienes partidas.</p>
          <p className="text-zinc-600 text-sm mt-1">
            Crea una para empezar a registrar buy-ins.
          </p>
        </div>
      ) : null}

      {active.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs uppercase tracking-wide text-zinc-500">En curso</h2>
          {active.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </section>
      ) : null}

      {settled.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs uppercase tracking-wide text-zinc-500">Cerradas</h2>
          {settled.map((s) => (
            <SessionRow key={s.id} session={s} />
          ))}
        </section>
      ) : null}

      <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
        <div className="max-w-xl mx-auto flex gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="px-4 h-12 rounded-full border border-zinc-800 text-sm text-zinc-300"
          >
            Importar
          </button>
          <Link
            href="/session/new"
            className="flex-1 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center"
          >
            + Nueva partida
          </Link>
        </div>
      </div>

      {importOpen ? (
        <ImportDialog
          onClose={() => setImportOpen(false)}
          onImported={() => setImportOpen(false)}
        />
      ) : null}
    </main>
  );
}

function SessionRow({ session }: { session: Session }) {
  const pot = session.events
    .filter((e) => !e.deleted)
    .reduce((sum, e) => sum + e.amount, 0);
  return (
    <Link
      href={`/session/${session.id}`}
      className="rounded-2xl border border-zinc-800 p-4 hover:bg-zinc-900 active:bg-zinc-900 transition-colors flex justify-between items-center"
    >
      <div>
        <div className="font-medium">{session.name || "Sin nombre"}</div>
        <div className="text-xs text-zinc-500 mt-1">
          {session.players.length} jugadores · buy-in {formatPEN(session.buyInAmount)}
        </div>
        <div className="text-xs text-zinc-600 mt-0.5">
          {formatDateTime(session.updatedAt)}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">{formatPEN(pot)}</div>
        {session.status === "settled" ? (
          <div className="text-xs text-zinc-500 mt-0.5">Cerrada</div>
        ) : null}
      </div>
    </Link>
  );
}

function ImportDialog({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    const parsed = importSessionJSON(raw);
    if (!parsed) {
      setError("JSON inválido o de una versión incompatible.");
      return;
    }
    saveSession(parsed);
    onImported();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
        <h2 className="text-lg font-semibold">Importar partida</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Pega el JSON exportado para restaurarla.
        </p>
        <textarea
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            setError(null);
          }}
          rows={8}
          className="mt-3 w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono focus:outline-none focus:border-zinc-600"
          placeholder='{"id":"...","schemaVersion":1,...}'
        />
        {error ? <p className="text-xs text-red-400 mt-2">{error}</p> : null}
        <div className="mt-4 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!raw.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
          >
            Importar
          </button>
        </div>
      </div>
    </div>
  );
}
