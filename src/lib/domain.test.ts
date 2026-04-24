import { describe, expect, it } from "vitest";
import {
  addBuyIn,
  addPlayer,
  buyInCount,
  createSession,
  finalChipsTotal,
  netPosition,
  removePlayer,
  sessionTotalPot,
  setFinalChips,
  totalPaid,
  undoLastBuyIn,
  zeroSumDiff,
} from "./domain";

function base() {
  return createSession({
    name: "Jueves",
    buyInAmount: 100,
    playerNames: ["Luis", "Juan", "Pedro"],
  });
}

describe("createSession", () => {
  it("trims names and drops empties", () => {
    const s = createSession({
      name: " Noche ",
      buyInAmount: 100,
      playerNames: ["Luis ", "", "  Juan"],
    });
    expect(s.name).toBe("Noche");
    expect(s.players.map((p) => p.name)).toEqual(["Luis", "Juan"]);
  });

  it("starts active with empty event log", () => {
    const s = base();
    expect(s.status).toBe("active");
    expect(s.events).toEqual([]);
  });
});

describe("addBuyIn + counts", () => {
  it("appends events, derives count and total", () => {
    let s = base();
    const luis = s.players[0];
    s = addBuyIn(s, luis.id);
    s = addBuyIn(s, luis.id);
    expect(buyInCount(s, luis.id)).toBe(2);
    expect(totalPaid(s, luis.id)).toBe(200);
  });

  it("does not mutate the original session", () => {
    const s = base();
    const before = s.events.length;
    addBuyIn(s, s.players[0].id);
    expect(s.events.length).toBe(before);
  });
});

describe("undoLastBuyIn", () => {
  it("soft-deletes the last event for that player only", () => {
    let s = base();
    const luis = s.players[0];
    const juan = s.players[1];
    s = addBuyIn(s, luis.id);
    s = addBuyIn(s, juan.id);
    s = addBuyIn(s, luis.id);
    s = undoLastBuyIn(s, luis.id);

    expect(buyInCount(s, luis.id)).toBe(1);
    expect(buyInCount(s, juan.id)).toBe(1);
    expect(s.events).toHaveLength(3);
    expect(s.events.filter((e) => e.deleted)).toHaveLength(1);
  });

  it("is a no-op when there is nothing to undo", () => {
    const s = base();
    const after = undoLastBuyIn(s, s.players[0].id);
    expect(after.events).toEqual(s.events);
  });

  it("skips already-deleted events when finding the last", () => {
    let s = base();
    const luis = s.players[0];
    s = addBuyIn(s, luis.id);
    s = addBuyIn(s, luis.id);
    s = undoLastBuyIn(s, luis.id);
    s = undoLastBuyIn(s, luis.id);
    expect(buyInCount(s, luis.id)).toBe(0);
    expect(s.events.filter((e) => e.deleted)).toHaveLength(2);
  });
});

describe("removePlayer", () => {
  it("removes a player with no buy-ins", () => {
    let s = base();
    const pedro = s.players[2];
    s = removePlayer(s, pedro.id);
    expect(s.players).toHaveLength(2);
  });

  it("refuses to remove a player who has bought in", () => {
    let s = base();
    const luis = s.players[0];
    s = addBuyIn(s, luis.id);
    const after = removePlayer(s, luis.id);
    expect(after.players).toHaveLength(3);
  });
});

describe("addPlayer", () => {
  it("appends a new player with a trimmed name", () => {
    const s = addPlayer(base(), "  Nico ");
    expect(s.players.at(-1)?.name).toBe("Nico");
  });

  it("ignores empty names", () => {
    const s = addPlayer(base(), "   ");
    expect(s.players).toHaveLength(3);
  });
});

describe("zero-sum derivations", () => {
  it("computes pot from active events only", () => {
    let s = base();
    const luis = s.players[0];
    s = addBuyIn(s, luis.id);
    s = addBuyIn(s, luis.id);
    s = undoLastBuyIn(s, luis.id);
    expect(sessionTotalPot(s)).toBe(100);
  });

  it("net position = finalChips - totalPaid", () => {
    let s = base();
    const [luis, juan] = s.players;
    s = addBuyIn(s, luis.id);
    s = addBuyIn(s, juan.id);
    s = setFinalChips(s, luis.id, 250);
    s = setFinalChips(s, juan.id, 0);

    expect(netPosition(s, s.players[0])).toBe(150);
    expect(netPosition(s, s.players[1])).toBe(-100);
  });

  it("zeroSumDiff is 0 when chips match the pot", () => {
    let s = base();
    const [a, b] = s.players;
    s = addBuyIn(s, a.id);
    s = addBuyIn(s, b.id);
    s = setFinalChips(s, a.id, 120);
    s = setFinalChips(s, b.id, 80);
    expect(finalChipsTotal(s)).toBe(200);
    expect(zeroSumDiff(s)).toBe(0);
  });

  it("zeroSumDiff surfaces missing or extra chips", () => {
    let s = base();
    const [a, b] = s.players;
    s = addBuyIn(s, a.id);
    s = addBuyIn(s, b.id);
    s = setFinalChips(s, a.id, 150);
    s = setFinalChips(s, b.id, 30);
    expect(zeroSumDiff(s)).toBe(-20);
  });
});
