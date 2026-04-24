"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSession } from "@/lib/domain";
import { saveSession } from "@/lib/storage";

export default function NewSessionPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [buyIn, setBuyIn] = useState(100);
  const [players, setPlayers] = useState<string[]>(["", ""]);

  const updatePlayer = (idx: number, value: string) => {
    setPlayers((prev) => prev.map((p, i) => (i === idx ? value : p)));
  };

  const addPlayerRow = () => setPlayers((prev) => [...prev, ""]);
  const removePlayerRow = (idx: number) =>
    setPlayers((prev) => prev.filter((_, i) => i !== idx));

  const validPlayers = players.map((p) => p.trim()).filter(Boolean);
  const canSubmit = name.trim().length > 0 && buyIn > 0 && validPlayers.length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const s = createSession({
      name: name.trim(),
      buyInAmount: buyIn,
      playerNames: validPlayers,
    });
    saveSession(s);
    router.replace(`/session/${s.id}`);
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 max-w-xl mx-auto w-full">
      <header className="pt-2 flex items-center gap-3">
        <Link href="/" className="text-zinc-400 text-sm">
          ← Volver
        </Link>
      </header>
      <h1 className="text-2xl font-bold">Nueva partida</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500 uppercase tracking-wide">
            Nombre
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jueves en casa de Juan"
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-3 text-base focus:outline-none focus:border-zinc-600"
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500 uppercase tracking-wide">
            Buy-in (PEN)
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={buyIn}
            onChange={(e) => setBuyIn(Number(e.target.value))}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-3 text-base focus:outline-none focus:border-zinc-600"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wide">
            Jugadores
          </span>
          {players.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={p}
                onChange={(e) => updatePlayer(i, e.target.value)}
                placeholder={`Jugador ${i + 1}`}
                className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-3 text-base focus:outline-none focus:border-zinc-600"
              />
              {players.length > 2 ? (
                <button
                  type="button"
                  onClick={() => removePlayerRow(i)}
                  className="px-3 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                  aria-label="Quitar jugador"
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={addPlayerRow}
            className="h-11 rounded-lg border border-dashed border-zinc-800 text-sm text-zinc-400 hover:bg-zinc-900"
          >
            + Agregar jugador
          </button>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium mt-4 disabled:opacity-40"
        >
          Empezar
        </button>
      </form>
    </main>
  );
}
