"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RebuyPicker } from "@/components/RebuyPicker";
import { SaveIndicator } from "@/components/SaveIndicator";
import {
  activeEvents,
  addBuyIn,
  addPlayer,
  buyInCount,
  removePlayer,
  reopen,
  sessionTotalPot,
  totalPaid,
  undoLastBuyIn,
} from "@/lib/domain";
import { formatPEN, formatTime } from "@/lib/format";
import { deleteSession } from "@/lib/storage";
import type { Player } from "@/lib/types";
import { useSession } from "@/lib/useSession";

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { session, loaded, savedAt, update } = useSession(id);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [customFor, setCustomFor] = useState<Player | null>(null);

  if (!loaded) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500 text-sm">Cargando…</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
        <p className="text-zinc-400">No encontré esta partida.</p>
        <Link href="/" className="text-emerald-400 text-sm">
          Volver al inicio
        </Link>
      </main>
    );
  }

  const handleDelete = () => {
    deleteSession(session.id);
    router.replace("/");
  };

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return;
    update((s) => addPlayer(s, newPlayerName));
    setNewPlayerName("");
    setShowAddPlayer(false);
  };

  const events = activeEvents(session);
  const pot = sessionTotalPot(session);
  const isSettled = session.status === "settled";

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pb-32 max-w-xl mx-auto w-full">
      <header className="pt-2 flex items-center justify-between gap-3">
        <Link href="/" className="text-zinc-400 text-sm">
          ← Volver
        </Link>
        <SaveIndicator savedAt={savedAt} />
      </header>

      <div>
        <h1 className="text-2xl font-bold">{session.name}</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Buy-in {formatPEN(session.buyInAmount)} · Pot {formatPEN(pot)}
        </p>
        {isSettled ? (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400">
            Partida cerrada
            <button
              type="button"
              onClick={() => update(reopen)}
              className="text-emerald-400 hover:text-emerald-300"
            >
              Reabrir
            </button>
          </div>
        ) : null}
      </div>

      <section className="flex flex-col gap-2">
        {session.players.map((player) => (
          <PlayerRow
            key={player.id}
            player={player}
            buyInAmount={session.buyInAmount}
            buyIns={buyInCount(session, player.id)}
            paid={totalPaid(session, player.id)}
            disabled={isSettled}
            onAddBuyIn={() => update((s) => addBuyIn(s, player.id))}
            onCustomBuyIn={() => setCustomFor(player)}
            onUndo={() => update((s) => undoLastBuyIn(s, player.id))}
            onRemove={() => update((s) => removePlayer(s, player.id))}
          />
        ))}
      </section>

      {!isSettled ? (
        showAddPlayer ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Nombre del jugador"
              className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-3 text-base focus:outline-none focus:border-zinc-600"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddPlayer();
                if (e.key === "Escape") setShowAddPlayer(false);
              }}
            />
            <button
              type="button"
              onClick={handleAddPlayer}
              className="px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
            >
              Agregar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddPlayer(true)}
            className="h-11 rounded-lg border border-dashed border-zinc-800 text-sm text-zinc-400 hover:bg-zinc-900"
          >
            + Agregar jugador
          </button>
        )
      ) : null}

      <section className="mt-2">
        <button
          type="button"
          onClick={() => setTimelineOpen((v) => !v)}
          className="text-sm text-zinc-400 flex items-center gap-2"
        >
          <span>{timelineOpen ? "▼" : "▶"}</span>
          Historial ({events.length})
        </button>
        {timelineOpen ? (
          <div className="mt-2 flex flex-col gap-1">
            {events.length === 0 ? (
              <p className="text-xs text-zinc-600">Todavía no hay movimientos.</p>
            ) : (
              [...events].reverse().map((e) => {
                const player = session.players.find((p) => p.id === e.playerId);
                return (
                  <div
                    key={e.id}
                    className="text-xs text-zinc-500 flex justify-between px-1"
                  >
                    <span>
                      {formatTime(e.at)} · {player?.name ?? "?"}
                    </span>
                    <span className="text-zinc-400">+{formatPEN(e.amount)}</span>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </section>

      <section className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="text-xs text-red-400 hover:text-red-300 self-start"
        >
          Eliminar partida
        </button>
      </section>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
        <div className="max-w-xl mx-auto">
          <Link
            href={`/session/${session.id}/settle`}
            className={`h-12 rounded-full w-full font-medium flex items-center justify-center ${
              session.events.filter((e) => !e.deleted).length === 0
                ? "bg-zinc-800 text-zinc-500 pointer-events-none"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {isSettled ? "Ver liquidación" : "Terminar partida"}
          </Link>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="¿Eliminar esta partida?"
        description="Esta acción no se puede deshacer. Perderás todos los buy-ins registrados."
        danger
        confirmLabel="Eliminar"
        typedPhrase="ELIMINAR"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <RebuyPicker
        open={customFor !== null}
        playerName={customFor?.name ?? ""}
        onPick={(amount) => {
          if (!customFor) return;
          const pid = customFor.id;
          update((s) => addBuyIn(s, pid, amount));
          setCustomFor(null);
        }}
        onCancel={() => setCustomFor(null)}
      />
    </main>
  );
}

function PlayerRow({
  player,
  buyInAmount,
  buyIns,
  paid,
  disabled,
  onAddBuyIn,
  onCustomBuyIn,
  onUndo,
  onRemove,
}: {
  player: Player;
  buyInAmount: number;
  buyIns: number;
  paid: number;
  disabled: boolean;
  onAddBuyIn: () => void;
  onCustomBuyIn: () => void;
  onUndo: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">{player.name}</div>
          <div className="text-xs text-zinc-500 mt-1">
            {buyIns} {buyIns === 1 ? "buy-in" : "buy-ins"} · {formatPEN(paid)}
          </div>
        </div>
        {buyIns === 0 && !disabled ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-zinc-500 hover:text-red-400"
            aria-label="Quitar jugador"
          >
            quitar
          </button>
        ) : null}
      </div>
      {!disabled ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onAddBuyIn}
            className="flex-1 h-11 rounded-full bg-zinc-800 hover:bg-zinc-700 font-medium text-sm"
          >
            + Rebuy {formatPEN(buyInAmount)}
          </button>
          <button
            type="button"
            onClick={onCustomBuyIn}
            className="px-4 h-11 rounded-full border border-zinc-800 text-sm hover:bg-zinc-900"
          >
            Otro
          </button>
          <button
            type="button"
            onClick={onUndo}
            disabled={buyIns === 0}
            className="px-4 h-11 rounded-full border border-zinc-800 text-sm disabled:opacity-30"
            aria-label="Deshacer último buy-in"
          >
            ↶
          </button>
        </div>
      ) : null}
    </div>
  );
}
