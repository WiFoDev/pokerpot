export type ID = string;

export type BuyInEvent = {
  id: ID;
  playerId: ID;
  amount: number;
  at: number;
  /** Soft-deleted via "undo last" so the log stays append-only. */
  deleted?: boolean;
};

export type Player = {
  id: ID;
  name: string;
  finalChips?: number;
};

export type SessionStatus = "active" | "settled";

export const CURRENT_SCHEMA_VERSION = 1 as const;

export type Session = {
  id: ID;
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  name: string;
  buyInAmount: number;
  currency: "PEN";
  status: SessionStatus;
  createdAt: number;
  updatedAt: number;
  settledAt?: number;
  players: Player[];
  events: BuyInEvent[];
};

export type Transfer = {
  from: ID;
  to: ID;
  amount: number;
};
