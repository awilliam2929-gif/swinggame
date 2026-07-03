import { describe, expect, it } from 'vitest'
import { computeBirdies, type BirdiesInput } from './birdies'

function input(overrides: Partial<BirdiesInput> = {}): BirdiesInput {
  return {
    scores: {
      a: [3, 4, 4],
      b: [4, 4, 4],
      c: [4, 4, 4],
    },
    entrantIds: ['a', 'b', 'c'],
    pars: [4, 4, 4],
    holeCount: 3,
    amounts: { birdie: 1, eagle: 5, albatross: 25 },
    ...overrides,
  }
}

describe('computeBirdies', () => {
  it('each other entrant pays the maker per birdie', () => {
    const result = computeBirdies(input())
    expect(result.events).toEqual([
      { hole: 1, playerId: 'a', tier: 'birdie', amountEach: 1 },
    ])
    expect(result.playerNet).toEqual({ a: 2, b: -1, c: -1 })
  })

  it('classifies eagles and albatrosses by par', () => {
    const result = computeBirdies(
      input({
        pars: [4, 4, 5],
        scores: { a: [2, 4, 2], b: [4, 4, 5], c: [4, 4, 5] },
      }),
    )
    expect(result.events.map((e) => e.tier)).toEqual(['eagle', 'albatross'])
    // a collects (5 + 25) from each of b and c.
    expect(result.playerNet.a).toBe(60)
  })

  it('nets sum to zero with multiple makers', () => {
    const result = computeBirdies(
      input({ scores: { a: [3, 4, 4], b: [4, 3, 4], c: [4, 4, 4] } }),
    )
    const total = Object.values(result.playerNet).reduce((s, v) => s + v, 0)
    expect(total).toBeCloseTo(0)
    expect(result.playerNet).toEqual({ a: 1, b: 1, c: -2 })
  })

  it('skips holes without scores and non-entrant scores', () => {
    const result = computeBirdies(
      input({ scores: { a: [null, 4, 4], b: [4, 4, 4], c: [4, 4, 4], z: [1, 1, 1] } }),
    )
    expect(result.events).toEqual([])
  })

  it('pays nothing with a single entrant', () => {
    const result = computeBirdies(input({ entrantIds: ['a'] }))
    expect(result.events).toEqual([])
    expect(result.playerNet).toEqual({ a: 0 })
  })
})
