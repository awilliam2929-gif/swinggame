import { describe, expect, it } from 'vitest'
import { computeSkins, type SkinsInput } from './skins'

function input(overrides: Partial<SkinsInput> = {}): SkinsInput {
  return {
    scores: {
      a: [3, 4, 4],
      b: [4, 4, 4],
      c: [4, 4, 4],
    },
    entrantIds: ['a', 'b', 'c'],
    pars: [4, 3, 4],
    holeCount: 3,
    ante: 6,
    greeniesEnabled: false,
    greenieWinners: {},
    ...overrides,
  }
}

describe('computeSkins', () => {
  it('awards a skin for the outright lowest score', () => {
    const result = computeSkins(input())
    expect(result.shares).toEqual([
      { hole: 1, playerId: 'a', kind: 'skin', score: 3 },
    ])
    // Pot 18, one share -> a nets 18 - 6, others -6.
    expect(result.playerNet).toEqual({ a: 12, b: -6, c: -6 })
  })

  it('ties are dead — no skin, no carryover', () => {
    const result = computeSkins(
      input({ scores: { a: [4, 4, 4], b: [4, 4, 4], c: [4, 4, 4] } }),
    )
    expect(result.shares).toEqual([])
    expect(result.refunded).toBe(true)
    expect(result.playerNet).toEqual({ a: 0, b: 0, c: 0 })
  })

  it('greenies share the same pot equally with skins', () => {
    const result = computeSkins(
      input({
        greeniesEnabled: true,
        greenieWinners: { 1: 'b' }, // hole 2 is the par 3
      }),
    )
    // Two shares: a's skin on 1, b's greenie on 2. Pot 18 -> $9 each.
    expect(result.shares).toHaveLength(2)
    expect(result.shareValue).toBe(9)
    expect(result.playerNet).toEqual({ a: 3, b: 3, c: -6 })
  })

  it('ignores greenies on non-par-3 holes and non-entrants', () => {
    const result = computeSkins(
      input({
        greeniesEnabled: true,
        greenieWinners: { 0: 'a', 1: 'zz', 2: 'b' }, // only hole 2 is par 3
      }),
    )
    expect(result.shares.filter((s) => s.kind === 'greenie')).toHaveLength(0)
  })

  it('greenies count for nothing when the toggle is off', () => {
    const result = computeSkins(input({ greenieWinners: { 1: 'b' } }))
    expect(result.shares.filter((s) => s.kind === 'greenie')).toHaveLength(0)
  })

  it('holes with missing entrant scores are pending, not scored', () => {
    const result = computeSkins(
      input({ scores: { a: [3, null, 4], b: [4, 4, 4], c: [4, 4, 4] } }),
    )
    expect(result.pendingHoles).toEqual([2])
    expect(result.shares).toHaveLength(1)
  })

  it('player nets always sum to zero', () => {
    const result = computeSkins(
      input({
        greeniesEnabled: true,
        greenieWinners: { 1: 'c' },
        scores: { a: [3, 4, 4], b: [4, 4, 3], c: [5, 4, 4] },
      }),
    )
    const total = Object.values(result.playerNet).reduce((s, v) => s + v, 0)
    expect(total).toBeCloseTo(0)
  })

  it('splits an odd pot into fractional share values', () => {
    // Pot 18, 4 shares -> 4.50 each; here: pot 15 (3 x $5), 2 shares.
    const result = computeSkins(
      input({
        ante: 5,
        greeniesEnabled: true,
        greenieWinners: { 1: 'b' },
      }),
    )
    expect(result.shareValue).toBeCloseTo(7.5)
  })
})
