import { describe, expect, it } from 'vitest'
import type { MatchResult } from '../engine/types'
import { teamPaymentsFromMatches } from './teamPayments'

function match(
  opponents: [string, string],
  totalSwing: number,
): MatchResult {
  return {
    opponents,
    outcomes: [],
    bets: [],
    totalSwing,
  }
}

describe('teamPaymentsFromMatches', () => {
  it('creates team-vs-team lines from each match', () => {
    const lines = teamPaymentsFromMatches(
      {
        swingTeam: ['alice', 'bob'],
        matches: [
          match(['carl', 'dave'], 12),
          match(['carl', 'eve'], -8),
          match(['dave', 'eve'], 0),
        ],
      },
      (id) =>
        ({ alice: 'Alice', bob: 'Bob', carl: 'Carl', dave: 'Dave', eve: 'Eve' })[
          id
        ] ?? id,
    )

    expect(lines).toHaveLength(2)
    expect(lines[0]).toEqual({
      id: 'carl+dave',
      fromLabel: 'Carl & Dave',
      toLabel: 'Swing Team (Alice & Bob)',
      amount: 12,
    })
    expect(lines[1]).toEqual({
      id: 'carl+eve',
      fromLabel: 'Swing Team (Alice & Bob)',
      toLabel: 'Carl & Eve',
      amount: 8,
    })
  })
})
