# PokerPot — TASKS

PWA para llevar la cuenta de buy-ins en partidas de poker caseras y calcular
quién le paga a quién al final de la noche usando un algoritmo de mínimo
número de transferencias (min-cashflow).

**Stack:** Next.js 16 (App Router, src dir, Turbopack) · React 19 · TypeScript
strict · Tailwind v4 · pnpm. Persistencia 100% cliente con `localStorage`.
Sin backend. Deploy en Vercel.

**Principios de diseño:**
- Confiabilidad > features. No perder datos por error.
- Event log apendable como fuente de verdad (los totales son derivados).
- Auto-save en cada mutación. Acciones destructivas requieren confirmación.

---

## Tareas

- [x] **TASK-01** — Scaffold Next.js + Tailwind + PWA manifest
  - `create-next-app` con TS, Tailwind v4, App Router, src dir, Turbopack
  - `src/app/manifest.ts` (PWA, `display: standalone`, tema oscuro)
  - `layout.tsx`: metadata, viewport con `themeColor`, `apple-web-app`
  - `lang="es-PE"`, layout mobile-first

- [x] **TASK-02** — Capa de almacenamiento (localStorage)
  - Keys: `pokerpot:index` (array de session IDs), `pokerpot:session:<id>`
  - `schemaVersion` por sesión para futuras migraciones
  - Store externo (`useSyncExternalStore`) con snapshots cacheados
  - Indicador "Guardado hace Xs" en la UI (derivado de `updatedAt`)
  - Sesiones corruptas no rompen el índice

- [x] **TASK-03** — Tipos + lógica de dominio del event log
  - `Session`, `Player`, `BuyInEvent` (append-only con soft-delete)
  - Derivaciones puras: `buyInCount`, `totalPaid`, `netPosition`, `zeroSumDiff`
  - `undoLastBuyIn()` como soft-delete marcado
  - 14 tests unitarios de las derivaciones

- [x] **TASK-04** — Home (lista de partidas + nueva)
  - Listar sesiones activas arriba, cerradas abajo
  - CTA "Nueva partida" → `/session/new`
  - Formulario: nombre, monto buy-in (default 100 PEN), jugadores iniciales

- [x] **TASK-05** — Partida activa (`/session/[id]`)
  - Lista de jugadores con contador de buy-ins y total pagado
  - Botón `+ Rebuy` por jugador (auto-guarda)
  - `↶ Deshacer último` (soft-delete del último evento)
  - Historial colapsable con timestamps
  - Agregar jugador en caliente, quitar solo si no tiene buy-ins
  - Botón "Terminar" → `/session/[id]/settle`

- [x] **TASK-06** — Liquidación (`/session/[id]/settle`)
  - Input de fichas finales por jugador
  - Validación zero-sum con diff visible (no bloquea)
  - Permite reabrir partidas cerradas

- [x] **TASK-07** — Algoritmo min-cashflow + pantalla de pagos
  - Greedy: ordena créditos y deudas, empareja el mayor con el mayor
  - Produce ≤ N-1 transferencias
  - Lista "Juan paga a Pedro" con monto en PEN
  - 6 tests cubriendo casos y conservación de dinero

- [x] **TASK-08** — Export / import JSON
  - Export: compartir resumen (Web Share API + fallback clipboard) y JSON crudo
  - Import: pegar JSON desde el home para restaurar

- [x] **TASK-09** — Confirmaciones destructivas + pulido PWA
  - Eliminar partida: requiere escribir "ELIMINAR"
  - Quitar jugador solo si no tiene buy-ins
  - Formato PEN (`Intl.NumberFormat('es-PE')`) en toda la app
  - Pendiente: íconos PWA 192/512 maskable (requiere arte)
