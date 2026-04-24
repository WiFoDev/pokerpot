import { newId } from "./id";
import {
  CURRENT_SCHEMA_VERSION,
  type BuyInEvent,
  type ID,
  type Player,
  type Session,
} from "./types";

export function createSession(input: {
  name: string;
  buyInAmount: number;
  playerNames: string[];
}): Session {
  const now = Date.now();
  return {
    id: newId(),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    name: input.name.trim(),
    buyInAmount: input.buyInAmount,
    currency: "PEN",
    status: "active",
    createdAt: now,
    updatedAt: now,
    players: input.playerNames
      .map((n) => n.trim())
      .filter(Boolean)
      .map((name) => ({ id: newId(), name })),
    events: [],
  };
}

export function activeEvents(session: Session): BuyInEvent[] {
  return session.events.filter((e) => !e.deleted);
}

export function playerEvents(session: Session, playerId: ID): BuyInEvent[] {
  return activeEvents(session).filter((e) => e.playerId === playerId);
}

export function buyInCount(session: Session, playerId: ID): number {
  return playerEvents(session, playerId).length;
}

export function totalPaid(session: Session, playerId: ID): number {
  return playerEvents(session, playerId).reduce((sum, e) => sum + e.amount, 0);
}

export function sessionTotalPot(session: Session): number {
  return activeEvents(session).reduce((sum, e) => sum + e.amount, 0);
}

export function netPosition(session: Session, player: Player): number {
  const paid = totalPaid(session, player.id);
  const final = player.finalChips ?? 0;
  return final - paid;
}

export function finalChipsTotal(session: Session): number {
  return session.players.reduce((sum, p) => sum + (p.finalChips ?? 0), 0);
}

export function zeroSumDiff(session: Session): number {
  return finalChipsTotal(session) - sessionTotalPot(session);
}

export function hasAllFinalChips(session: Session): boolean {
  return session.players.every(
    (p) => typeof p.finalChips === "number" && !Number.isNaN(p.finalChips),
  );
}

export function addBuyIn(
  session: Session,
  playerId: ID,
  amount?: number,
): Session {
  const now = Date.now();
  const event: BuyInEvent = {
    id: newId(),
    playerId,
    amount: amount ?? session.buyInAmount,
    at: now,
  };
  return { ...session, events: [...session.events, event], updatedAt: now };
}

export function undoLastBuyIn(session: Session, playerId: ID): Session {
  const now = Date.now();
  const activeForPlayer = session.events.filter(
    (e) => e.playerId === playerId && !e.deleted,
  );
  const last = activeForPlayer.at(-1);
  if (!last) return session;
  return {
    ...session,
    events: session.events.map((e) =>
      e.id === last.id ? { ...e, deleted: true } : e,
    ),
    updatedAt: now,
  };
}

export function addPlayer(session: Session, name: string): Session {
  const trimmed = name.trim();
  if (!trimmed) return session;
  return {
    ...session,
    players: [...session.players, { id: newId(), name: trimmed }],
    updatedAt: Date.now(),
  };
}

export function removePlayer(session: Session, playerId: ID): Session {
  if (buyInCount(session, playerId) > 0) return session;
  return {
    ...session,
    players: session.players.filter((p) => p.id !== playerId),
    updatedAt: Date.now(),
  };
}

export function setFinalChips(
  session: Session,
  playerId: ID,
  chips: number | undefined,
): Session {
  return {
    ...session,
    players: session.players.map((p) =>
      p.id === playerId ? { ...p, finalChips: chips } : p,
    ),
    updatedAt: Date.now(),
  };
}

export function settle(session: Session): Session {
  const now = Date.now();
  return { ...session, status: "settled", settledAt: now, updatedAt: now };
}

export function reopen(session: Session): Session {
  return {
    ...session,
    status: "active",
    settledAt: undefined,
    updatedAt: Date.now(),
  };
}
