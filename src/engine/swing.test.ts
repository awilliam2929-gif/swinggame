import { describe, expect, it } from 'vitest'
import {
  bestBall,
  combinations,
  holeOutcomes,
  scoreBet,
  settleMatch,
  settleSwingGame,
  spawnBets,
} from './swing'
import type { HoleOutcome, Scores, SwingConfig } from './types'

/** Build outcomes from a compact string: W = Swing wins, L = Swing loses, T = push. */
function outcomes(pattern: string): HoleOutcome[] {
  return [...pattern].map((c) =>
    c === 'W' ? 'SWING' : c === 'L' ? 'OPP' : 'PUSH',
  )
}

function config(overrides: Partial<SwingConfig> = {}): SwingConfig {
  return {
    holeCount: 18,
    dollarsPerHole: 1,
    downs: { n: 0, stacking: false },
    ...overrides,
  }
}

describe('combinations', () => {
  it('generates C(n,2) pairs — 18 players -> 153 matches', () => {
    const players = Array.from({ length: 18 }, (_, i) => `p${i}`)
    expect(combinations(players)).toHaveLength(153)
  })

  it('handles the minimum of 2 players', () => {
    expect(combinations(['a', 'b'])).toEqual([['a', 'b']])
  })
})

describe('bestBall', () => {
  it('takes the lower score on each hole', () => {
    const scores: Scores = {
      a: [4, 5, 3],
      b: [5, 4, 3],
    }
    expect(bestBall(scores, ['a', 'b'], 3)).toEqual([4, 4, 3])
  })

  it('throws when a player is missing scores', () => {
    const scores: Scores = { a: [4, 5, 3] }
    expect(() => bestBall(scores, ['a', 'b'], 3)).toThrow(/Missing scores/)
  })

  it('throws when a player has fewer holes than the round', () => {
    const scores: Scores = { a: [4, 5], b: [4, 5, 3] }
    expect(() => bestBall(scores, ['a', 'b'], 3)).toThrow(/Missing scores/)
  })
})

describe('holeOutcomes', () => {
  it('scores each hole from the Swing Team perspective', () => {
    expect(holeOutcomes([3, 5, 4], [4, 4, 4])).toEqual([
      'SWING',
      'OPP',
      'PUSH',
    ])
  })
})

describe('spawnBets — standard (non-stacking) downs', () => {
  it('reproduces the SPEC worked example: L L W W L L at 2-downs', () => {
    // Bet 1 original; Swing loses 1-2 -> bet at 3; Opp loses 3-4 -> bet at 5;
    // Swing loses 5-6 -> bet at 7.
    const bets = spawnBets(outcomes('LLWWLL' + 'T'.repeat(12)), {
      n: 2,
      stacking: false,
    })
    expect(bets).toEqual([
      { startHole: 1, trigger: 'ORIGINAL' },
      { startHole: 3, trigger: 'SWING' },
      { startHole: 5, trigger: 'OPP' },
      { startHole: 7, trigger: 'SWING' },
    ])
  })

  it('resets the counter after a trigger: 4 straight losses -> 2 bets', () => {
    const bets = spawnBets(outcomes('LLLL' + 'T'.repeat(14)), {
      n: 2,
      stacking: false,
    })
    expect(bets.map((b) => b.startHole)).toEqual([1, 3, 5])
  })

  it('3 straight losses spawns only one bet (holes 2+3 do not re-trigger)', () => {
    const bets = spawnBets(outcomes('LLL' + 'T'.repeat(15)), {
      n: 2,
      stacking: false,
    })
    expect(bets.map((b) => b.startHole)).toEqual([1, 3])
  })

  it('a push breaks the streak', () => {
    // L T L L: the push after hole 1 resets, so the trigger is holes 3+4.
    const bets = spawnBets(outcomes('LTLL' + 'T'.repeat(14)), {
      n: 2,
      stacking: false,
    })
    expect(bets.map((b) => b.startHole)).toEqual([1, 5])
  })

  it('a win by the streaking team breaks the streak', () => {
    const bets = spawnBets(outcomes('LWLL' + 'T'.repeat(14)), {
      n: 2,
      stacking: false,
    })
    expect(bets.map((b) => b.startHole)).toEqual([1, 5])
  })

  it('does not spawn a bet that would start past the final hole', () => {
    const bets = spawnBets(outcomes('T'.repeat(16) + 'LL'), {
      n: 2,
      stacking: false,
    })
    expect(bets).toHaveLength(1)
  })

  it('spawns nothing when downs are off (n = 0)', () => {
    const bets = spawnBets(outcomes('LLLLLLLLLLLLLLLLLL'), {
      n: 0,
      stacking: false,
    })
    expect(bets).toHaveLength(1)
  })

  it('works at 1-down: every lost hole spawns a bet', () => {
    const bets = spawnBets(outcomes('LLW' + 'T'.repeat(15)), {
      n: 1,
      stacking: false,
    })
    expect(bets).toEqual([
      { startHole: 1, trigger: 'ORIGINAL' },
      { startHole: 2, trigger: 'SWING' },
      { startHole: 3, trigger: 'SWING' },
      { startHole: 4, trigger: 'OPP' },
    ])
  })
})

describe('spawnBets — stacking downs', () => {
  it('3 straight losses at 2-downs spawns bets after holes 2 AND 3', () => {
    const bets = spawnBets(outcomes('LLL' + 'T'.repeat(15)), {
      n: 2,
      stacking: true,
    })
    expect(bets.map((b) => b.startHole)).toEqual([1, 3, 4])
  })

  it('4 straight losses at 2-downs spawns 3 bets (sliding window)', () => {
    const bets = spawnBets(outcomes('LLLL' + 'T'.repeat(14)), {
      n: 2,
      stacking: true,
    })
    expect(bets.map((b) => b.startHole)).toEqual([1, 3, 4, 5])
  })

  it('a push still breaks the streak in stacking mode', () => {
    const bets = spawnBets(outcomes('LLTL' + 'T'.repeat(14)), {
      n: 2,
      stacking: true,
    })
    expect(bets.map((b) => b.startHole)).toEqual([1, 3])
  })
})

describe('scoreBet', () => {
  it('nets holes won minus lost times the stake: 11W 7L at $1 -> $4', () => {
    const o = outcomes('W'.repeat(11) + 'L'.repeat(7))
    const result = scoreBet(o, { startHole: 1, trigger: 'ORIGINAL' }, 1)
    expect(result.holesWonSwing).toBe(11)
    expect(result.holesWonOpp).toBe(7)
    expect(result.valueSwing).toBe(4)
  })

  it('only counts holes from the bet start hole onward', () => {
    const o = outcomes('LLWWWW' + 'T'.repeat(12))
    const result = scoreBet(o, { startHole: 3, trigger: 'SWING' }, 2)
    expect(result.valueSwing).toBe(8) // 4 wins, 0 losses, $2/hole
  })

  it('pushes are worth nothing', () => {
    const o = outcomes('T'.repeat(18))
    const result = scoreBet(o, { startHole: 1, trigger: 'ORIGINAL' }, 1)
    expect(result.valueSwing).toBe(0)
  })
})

describe('settleMatch', () => {
  /**
   * Scores where s1 and o1 decide every hole (partners always score 9):
   * swing best ball = s1, opp best ball = o1.
   */
  function matchScores(s1: number[], o1: number[]): Scores {
    const nines = Array(s1.length).fill(9)
    return { s1, s2: nines, o1, o2: [...nines] }
  }

  it('runs the SPEC worked example end to end', () => {
    // Swing: L L W W L L then 12 pushes. 2-downs, $1/hole.
    const s1 = [5, 5, 4, 4, 5, 5, ...Array(12).fill(4)]
    const o1 = [4, 4, 5, 5, 4, 4, ...Array(12).fill(4)]
    const match = settleMatch(
      matchScores(s1, o1),
      ['s1', 's2'],
      ['o1', 'o2'],
      config({ downs: { n: 2, stacking: false } }),
    )

    expect(match.bets.map((b) => b.startHole)).toEqual([1, 3, 5, 7])
    // Bet 1 (holes 1-18): 2W 4L = -$2. Bet 2 (3-18): 2W 2L = $0.
    // Bet 3 (5-18): 0W 2L = -$2. Bet 4 (7-18): all pushes = $0.
    expect(match.bets.map((b) => b.valueSwing)).toEqual([-2, 0, -2, 0])
    expect(match.totalSwing).toBe(-4)
  })

  it('supports 9-hole rounds', () => {
    const s1 = Array(9).fill(4) // Swing wins every hole
    const o1 = Array(9).fill(5)
    const match = settleMatch(
      matchScores(s1, o1),
      ['s1', 's2'],
      ['o1', 'o2'],
      config({ holeCount: 9, downs: { n: 2, stacking: false } }),
    )
    expect(match.outcomes).toHaveLength(9)
    // Opp loses every hole: bets spawn at 3, 5, 7, 9 (none past hole 9).
    expect(match.bets.map((b) => b.startHole)).toEqual([1, 3, 5, 7, 9])
    // 9 + 7 + 5 + 3 + 1 holes won across the five bets.
    expect(match.totalSwing).toBe(25)
  })
})

describe('settleSwingGame', () => {
  /** n entrants, everyone scores par except designated heroes. */
  function flatScores(players: string[], holes = 18): Scores {
    const scores: Scores = {}
    for (const p of players) scores[p] = Array(holes).fill(4)
    return scores
  }

  it('creates a match against every combination: 20 entrants -> 153', () => {
    const players = Array.from({ length: 20 }, (_, i) => `p${i}`)
    const result = settleSwingGame(
      flatScores(players),
      players,
      ['p0', 'p1'],
      config(),
    )
    expect(result.matches).toHaveLength(153)
  })

  it('player nets always sum to zero', () => {
    const players = ['a', 'b', 'c', 'd', 'e', 'f']
    const scores = flatScores(players)
    scores.a = Array(18).fill(3) // Swing Team member wins everything
    scores.f = [2, ...Array(17).fill(4)] // one opponent steals a hole
    const result = settleSwingGame(
      scores,
      players,
      ['a', 'b'],
      config({ downs: { n: 2, stacking: false }, dollarsPerHole: 2 }),
    )
    const total = Object.values(result.playerNet).reduce((s, v) => s + v, 0)
    expect(total).toBeCloseTo(0)
  })

  it('pays each swing member and charges each opponent the match value', () => {
    // 4 entrants -> swing team vs one single combination.
    const players = ['a', 'b', 'c', 'd']
    const scores = flatScores(players)
    scores.a = Array(18).fill(3) // swing wins all 18 holes
    const result = settleSwingGame(scores, players, ['a', 'b'], config())
    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].totalSwing).toBe(18)
    expect(result.playerNet).toEqual({ a: 18, b: 18, c: -18, d: -18 })
  })

  it('a non-swing player net is the sum across all their combinations', () => {
    const players = ['a', 'b', 'c', 'd', 'e']
    const scores = flatScores(players)
    scores.a = Array(18).fill(3) // swing sweeps every match
    const result = settleSwingGame(scores, players, ['a', 'b'], config())
    // c, d, e form 3 combos; each player appears in 2 of them.
    expect(result.matches).toHaveLength(3)
    expect(result.playerNet.c).toBe(-36)
    expect(result.playerNet.a).toBe(3 * 18)
  })

  it('rejects a swing team that is not among the entrants', () => {
    const players = ['a', 'b', 'c', 'd']
    expect(() =>
      settleSwingGame(flatScores(players), players, ['a', 'z'], config()),
    ).toThrow(/entrants/)
  })

  it('rejects a game with fewer than 2 non-swing entrants', () => {
    const players = ['a', 'b', 'c']
    expect(() =>
      settleSwingGame(flatScores(players), players, ['a', 'b'], config()),
    ).toThrow(/at least 2/)
  })
})
