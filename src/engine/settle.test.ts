import { describe, expect, it } from 'vitest'
import { netPayments } from './settle'

describe('netPayments', () => {
  it('handles a simple two-player settlement', () => {
    expect(netPayments({ a: 5, b: -5 })).toEqual([
      { from: 'b', to: 'a', amount: 5 },
    ])
  })

  it('nets a group down to few transfers', () => {
    const payments = netPayments({ a: 10, b: -4, c: -6 })
    expect(payments).toEqual([
      { from: 'c', to: 'a', amount: 6 },
      { from: 'b', to: 'a', amount: 4 },
    ])
  })

  it('splits one debtor across multiple creditors', () => {
    const payments = netPayments({ a: 3, b: 7, c: -10 })
    expect(payments).toEqual([
      { from: 'c', to: 'b', amount: 7 },
      { from: 'c', to: 'a', amount: 3 },
    ])
  })

  it('returns nothing when everyone is even', () => {
    expect(netPayments({ a: 0, b: 0 })).toEqual([])
  })

  it('conserves money: payments received equal each net exactly', () => {
    const net = { a: 12.5, b: -3.25, c: -7.75, d: 4.5, e: -6 }
    const payments = netPayments(net)
    const flow: Record<string, number> = { a: 0, b: 0, c: 0, d: 0, e: 0 }
    for (const p of payments) {
      flow[p.from] -= p.amount
      flow[p.to] += p.amount
    }
    for (const id of Object.keys(net)) {
      expect(flow[id]).toBeCloseTo(net[id as keyof typeof net], 2)
    }
  })

  it('never produces more than (players - 1) transfers', () => {
    const net = { a: 1, b: 2, c: 3, d: -1.5, e: -1.5, f: -3 }
    expect(netPayments(net).length).toBeLessThanOrEqual(5)
  })
})
