"use client";

import { useEffect, useState } from "react";
import { formatRelative } from "@/lib/format";

export function SaveIndicator({ savedAt }: { savedAt: number | null }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 5000);
    return () => window.clearInterval(id);
  }, []);

  if (!savedAt) {
    return <span className="text-xs text-zinc-500">Sin guardar</span>;
  }
  return (
    <span className="text-xs text-zinc-500">
      Guardado {formatRelative(savedAt)}
    </span>
  );
}
