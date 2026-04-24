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

- [ ] **TASK-02** — Capa de almacenamiento (localStorage)
  - Keys: `pokerpot:index` (array de session IDs), `pokerpot:session:<id>`
  - `schemaVersion` por sesión para futuras migraciones
  - API: `listSessions`, `getSession`, `saveSession`, `deleteSession`
  - Indicador "Guardado hace Xs" en la UI
  - Sesiones corruptas no rompen el índice

- [ ] **TASK-03** — Tipos + lógica de dominio del event log
  - `Session`, `Player`, `BuyInEvent` (append-only)
  - Derivaciones puras: `totalBuyIns(player, events)`, `netPosition(player)`
  - `undoLastEvent()` como soft-delete marcado
  - Tests unitarios de las derivaciones

- [ ] **TASK-04** — Home (lista de partidas + nueva)
  - Listar sesiones activas arriba, archivadas abajo
  - CTA "Nueva partida" → `/session/new`
  - Formulario: nombre, monto buy-in (default 100 PEN), jugadores iniciales

- [ ] **TASK-05** — Partida activa (`/session/[id]`)
  - Lista de jugadores con contador de buy-ins y total pagado
  - Botón `+ Rebuy` por jugador (auto-guarda)
  - `↶ Deshacer último` (soft-delete del último evento)
  - Timeline con timestamps
  - Botón "Terminar" → `/session/[id]/settle`

- [ ] **TASK-06** — Liquidación (`/session/[id]/settle`)
  - Input de fichas finales por jugador
  - Validación zero-sum con diff visible (no bloquea)
  - Al confirmar, dispara TASK-07

- [ ] **TASK-07** — Algoritmo min-cashflow + pantalla de pagos
  - Greedy: ordena créditos y deudas, empareja el mayor con el mayor
  - Produce ≤ N-1 transferencias
  - Lista "Juan paga 150 a Pedro"
  - Tests con casos conocidos

- [ ] **TASK-08** — Export / import JSON
  - Export: copiar al portapapeles + Web Share API
  - Import: pegar JSON para restaurar (útil si se pierde storage)

- [ ] **TASK-09** — Confirmaciones destructivas + pulido PWA
  - Eliminar partida: requiere escribir "ELIMINAR"
  - Íconos PWA (192, 512, maskable)
  - Install prompt
  - Formato PEN (`Intl.NumberFormat('es-PE')`) en toda la app
