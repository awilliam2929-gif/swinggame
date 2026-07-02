/**
 * Settlement netting: reduce per-player nets to a short list of
 * "X pays Y" transfers using greedy largest-debtor -> largest-creditor
 * matching. Amounts are rounded to cents.
 */

import type { PlayerId } from './types'

export interface Payment {
  from: PlayerId
  to: PlayerId
  amount: number
}

const EPSILON = 0.005 // below half a cent counts as settled

export function netPayments(net: Record<PlayerId, number>): Payment[] {
  const creditors = Object.entries(net)
    .filter(([, v]) => v > EPSILON)
    .map(([id, v]) => ({ id, amount: v }))
    .sort((a, b) => b.amount - a.amount)
  const debtors = Object.entries(net)
    .filter(([, v]) => v < -EPSILON)
    .map(([id, v]) => ({ id, amount: -v }))
    .sort((a, b) => b.amount - a.amount)

  const payments: Payment[] = []
  let ci = 0
  let di = 0
  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]
    const debtor = debtors[di]
    const amount = Math.min(creditor.amount, debtor.amount)
    const rounded = Math.round(amount * 100) / 100
    if (rounded > 0) {
      payments.push({ from: debtor.id, to: creditor.id, amount: rounded })
    }
    creditor.amount -= amount
    debtor.amount -= amount
    if (creditor.amount <= EPSILON) ci++
    if (debtor.amount <= EPSILON) di++
  }
  return payments
}
