const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 0,
});

export function formatPEN(value: number): string {
  return currencyFormatter.format(value);
}

export function formatInt(value: number): string {
  return numberFormatter.format(value);
}

const timeFormatter = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatTime(ts: number): string {
  return timeFormatter.format(new Date(ts));
}

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(ts: number): string {
  return dateFormatter.format(new Date(ts));
}

export function formatRelative(fromTs: number, nowTs: number = Date.now()): string {
  const diff = Math.max(0, Math.floor((nowTs - fromTs) / 1000));
  if (diff < 5) return "hace un momento";
  if (diff < 60) return `hace ${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}
