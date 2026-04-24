import { netPosition } from "./domain";
import type { Session, Transfer } from "./types";

/**
 * Greedy min-cashflow: biggest creditor settles with biggest debtor until
 * everyone is flat. Produces at most N-1 transfers.
 */
export function computeSettlement(session: Session): Transfer[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const p of session.players) {
    const n = netPosition(session, p);
    if (n > 0) creditors.push({ id: p.id, amount: n });
    else if (n < 0) debtors.push({ id: p.id, amount: -n });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0) {
      transfers.push({ from: debtors[i].id, to: creditors[j].id, amount });
    }
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount === 0) i++;
    if (creditors[j].amount === 0) j++;
  }

  return transfers;
}
