"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { SaveIndicator } from "@/components/SaveIndicator";
import {
  finalChipsTotal,
  hasAllFinalChips,
  netPosition,
  reopen,
  sessionTotalPot,
  setFinalChips,
  settle,
  totalPaid,
  zeroSumDiff,
} from "@/lib/domain";
import { formatPEN } from "@/lib/format";
import { exportSessionJSON } from "@/lib/storage";
import { computeSettlement } from "@/lib/settlement";
import { useSession } from "@/lib/useSession";

export default function SettlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { session, loaded, savedAt, update } = useSession(id);
  const [copied, setCopied] = useState(false);

  const transfers = useMemo(() => {
    if (!session) return [];
    if (!hasAllFinalChips(session)) return [];
    return computeSettlement(session);
  }, [session]);

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

  const pot = sessionTotalPot(session);
  const chipsTotal = finalChipsTotal(session);
  const diff = zeroSumDiff(session);
  const allFilled = hasAllFinalChips(session);
  const isSettled = session.status === "settled";
  const playerById = new Map(session.players.map((p) => [p.id, p]));

  const handleSettle = () => {
    update(settle);
  };

  const handleReopen = () => {
    update(reopen);
  };

  const buildSummary = () => {
    const lines: string[] = [];
    lines.push(`*${session.name}* — PokerPot`);
    lines.push(`Buy-in ${formatPEN(session.buyInAmount)} · Pot ${formatPEN(pot)}`);
    lines.push("");
    lines.push("Resultado:");
    for (const p of session.players) {
      const n = netPosition(session, p);
      const sign = n > 0 ? "+" : "";
      lines.push(`  ${p.name}: ${sign}${formatPEN(n)}`);
    }
    if (transfers.length) {
      lines.push("");
      lines.push("Pagos:");
      for (const t of transfers) {
        const from = playerById.get(t.from)?.name ?? "?";
        const to = playerById.get(t.to)?.name ?? "?";
        lines.push(`  ${from} → ${to}: ${formatPEN(t.amount)}`);
      }
    }
    return lines.join("\n");
  };

  const handleShare = async () => {
    const text = buildSummary();
    const canNativeShare =
      typeof navigator !== "undefined" && "share" in navigator;
    if (canNativeShare) {
      try {
        await navigator.share({ title: session.name, text });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleExportJSON = async () => {
    try {
      await navigator.clipboard.writeText(exportSessionJSON(session));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pb-32 max-w-xl mx-auto w-full">
      <header className="pt-2 flex items-center justify-between gap-3">
        <Link href={`/session/${session.id}`} className="text-zinc-400 text-sm">
          ← Volver
        </Link>
        <SaveIndicator savedAt={savedAt} />
      </header>

      <div>
        <h1 className="text-2xl font-bold">
          {isSettled ? "Liquidación" : "Fichas finales"}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Pot total {formatPEN(pot)}
        </p>
      </div>

      <section className="flex flex-col gap-2">
        {session.players.map((p) => {
          const paid = totalPaid(session, p.id);
          const n = netPosition(session, p);
          return (
            <div
              key={p.id}
              className="rounded-2xl border border-zinc-800 p-4 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  pagó {formatPEN(paid)}
                  {allFilled ? (
                    <>
                      {" · "}
                      <span className={n >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {n >= 0 ? "+" : ""}
                        {formatPEN(n)}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="fichas"
                value={p.finalChips ?? ""}
                disabled={isSettled}
                onChange={(e) => {
                  const raw = e.target.value;
                  const val = raw === "" ? undefined : Number(raw);
                  update((s) => setFinalChips(s, p.id, val));
                }}
                className="w-28 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-right text-base focus:outline-none focus:border-zinc-600 disabled:opacity-60"
              />
            </div>
          );
        })}
      </section>

      {allFilled ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            diff === 0
              ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-300"
              : "border-amber-900/60 bg-amber-950/30 text-amber-300"
          }`}
        >
          {diff === 0 ? (
            <>Las fichas cuadran con el pot.</>
          ) : (
            <>
              Diferencia: {diff > 0 ? "+" : ""}
              {formatPEN(diff)}. {diff > 0 ? "Sobran" : "Faltan"} fichas. Puedes
              continuar igual; revisa si se perdió alguna ficha.
            </>
          )}
          <div className="text-xs text-zinc-400 mt-1">
            Fichas totales {formatPEN(chipsTotal)} / pot {formatPEN(pot)}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 px-4 py-3 text-sm text-zinc-400">
          Ingresa las fichas finales de cada jugador para calcular los pagos.
        </div>
      )}

      {allFilled && transfers.length > 0 ? (
        <section className="mt-2">
          <h2 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
            Pagos
          </h2>
          <ul className="flex flex-col gap-2">
            {transfers.map((t, i) => {
              const from = playerById.get(t.from)?.name ?? "?";
              const to = playerById.get(t.to)?.name ?? "?";
              return (
                <li
                  key={i}
                  className="rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 flex items-center justify-between"
                >
                  <span className="text-sm">
                    <span className="text-zinc-300">{from}</span>
                    <span className="text-zinc-500 mx-2">paga a</span>
                    <span className="text-zinc-300">{to}</span>
                  </span>
                  <span className="font-medium">{formatPEN(t.amount)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {allFilled && transfers.length === 0 && diff === 0 ? (
        <p className="text-sm text-zinc-400">Nadie debe nada a nadie.</p>
      ) : null}

      {allFilled ? (
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 h-11 rounded-full border border-zinc-800 text-sm font-medium"
          >
            {copied ? "¡Copiado!" : "Compartir resumen"}
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="px-4 h-11 rounded-full border border-zinc-800 text-sm"
            title="Copia el JSON crudo para respaldo"
          >
            JSON
          </button>
        </div>
      ) : null}

      <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
        <div className="max-w-xl mx-auto">
          {isSettled ? (
            <button
              type="button"
              onClick={handleReopen}
              className="w-full h-12 rounded-full border border-zinc-700 text-zinc-200 font-medium"
            >
              Reabrir partida
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSettle}
              disabled={!allFilled}
              className="w-full h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-40"
            >
              Cerrar partida
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
