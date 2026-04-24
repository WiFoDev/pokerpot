"use client";

import { useEffect, useRef, useState } from "react";
import { formatPEN } from "@/lib/format";

const DEFAULT_PRESETS = [150, 200, 300];

export function RebuyPicker({
  open,
  playerName,
  presets = DEFAULT_PRESETS,
  onPick,
  onCancel,
}: {
  open: boolean;
  playerName: string;
  presets?: number[];
  onPick: (amount: number) => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <Body
      playerName={playerName}
      presets={presets}
      onPick={onPick}
      onCancel={onCancel}
    />
  );
}

function Body({
  playerName,
  presets,
  onPick,
  onCancel,
}: {
  playerName: string;
  presets: number[];
  onPick: (amount: number) => void;
  onCancel: () => void;
}) {
  const [custom, setCustom] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const customNum = Number(custom);
  const canConfirmCustom = custom.trim() !== "" && customNum > 0 && !Number.isNaN(customNum);
  const commitCustom = () => {
    if (canConfirmCustom) onPick(customNum);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
        <h2 className="text-lg font-semibold">Rebuy de {playerName}</h2>
        <p className="text-sm text-zinc-500 mt-1">Elige otro monto</p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPick(p)}
              className="h-14 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-medium"
            >
              {formatPEN(p)}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-xs text-zinc-500 uppercase tracking-wide">
            Monto personalizado
          </label>
          <div className="mt-1 flex gap-2">
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              min={1}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitCustom();
              }}
              placeholder="ej. 250"
              className="flex-1 rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-3 text-base focus:outline-none focus:border-zinc-600"
            />
            <button
              type="button"
              onClick={commitCustom}
              disabled={!canConfirmCustom}
              className="px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-40"
            >
              Agregar
            </button>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
