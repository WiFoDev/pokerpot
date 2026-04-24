import { describe, expect, it } from "vitest";
import {
  addBuyIn,
  createSession,
  setFinalChips,
  zeroSumDiff,
} from "./domain";
import { computeSettlement } from "./settlement";
import type { Session } from "./types";

function prime(playerNames: string[]): Session {
  return createSession({ name: "t", buyInAmount: 100, playerNames });
}

function byName(s: Session, name: string) {
  return s.players.find((p) => p.name === name)!;
}

describe("computeSettlement", () => {
  it("no transfers when everyone breaks even", () => {
    let s = prime(["A", "B"]);
    s = addBuyIn(s, byName(s, "A").id);
    s = addBuyIn(s, byName(s, "B").id);
    s = setFinalChips(s, byName(s, "A").id, 100);
    s = setFinalChips(s, byName(s, "B").id, 100);
    expect(computeSettlement(s)).toEqual([]);
  });

  it("single debtor to single creditor", () => {
    let s = prime(["A", "B"]);
    s = addBuyIn(s, byName(s, "A").id);
    s = addBuyIn(s, byName(s, "B").id);
    s = setFinalChips(s, byName(s, "A").id, 0);
    s = setFinalChips(s, byName(s, "B").id, 200);

    const t = computeSettlement(s);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({
      from: byName(s, "A").id,
      to: byName(s, "B").id,
      amount: 100,
    });
  });

  it("splits biggest debtor across two creditors", () => {
    let s = prime(["A", "B", "C"]);
    // A and B each buy in once, C buys in twice; C loses it all
    s = addBuyIn(s, byName(s, "A").id);
    s = addBuyIn(s, byName(s, "B").id);
    s = addBuyIn(s, byName(s, "C").id);
    s = addBuyIn(s, byName(s, "C").id);
    s = setFinalChips(s, byName(s, "A").id, 250);
    s = setFinalChips(s, byName(s, "B").id, 150);
    s = setFinalChips(s, byName(s, "C").id, 0);

    expect(zeroSumDiff(s)).toBe(0);
    const t = computeSettlement(s);
    // C owes 200, A is up 150, B is up 50 → two transfers
    expect(t).toHaveLength(2);
    const total = t.reduce((sum, x) => sum + x.amount, 0);
    expect(total).toBe(200);
    for (const x of t) {
      expect(x.from).toBe(byName(s, "C").id);
    }
  });

  it("produces at most N-1 transfers", () => {
    let s = prime(["A", "B", "C", "D", "E"]);
    for (const p of s.players) {
      s = addBuyIn(s, p.id);
      s = addBuyIn(s, p.id);
    }
    // Skewed result
    s = setFinalChips(s, byName(s, "A").id, 500);
    s = setFinalChips(s, byName(s, "B").id, 300);
    s = setFinalChips(s, byName(s, "C").id, 150);
    s = setFinalChips(s, byName(s, "D").id, 50);
    s = setFinalChips(s, byName(s, "E").id, 0);

    const t = computeSettlement(s);
    expect(t.length).toBeLessThanOrEqual(s.players.length - 1);
  });

  it("conserves money — sum of transfers equals total debt", () => {
    let s = prime(["A", "B", "C"]);
    s = addBuyIn(s, byName(s, "A").id);
    s = addBuyIn(s, byName(s, "B").id);
    s = addBuyIn(s, byName(s, "C").id);
    s = setFinalChips(s, byName(s, "A").id, 170);
    s = setFinalChips(s, byName(s, "B").id, 90);
    s = setFinalChips(s, byName(s, "C").id, 40);

    const t = computeSettlement(s);
    const moved = t.reduce((sum, x) => sum + x.amount, 0);
    expect(moved).toBe(70); // B is -10, C is -60 → creditors get 70 total
  });
});
