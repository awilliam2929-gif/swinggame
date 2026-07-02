import { describe, expect, it } from 'vitest'
import type { GameDay, Player } from '../store/types'
import { careerStats, chronological, daySummaries } from './stats'

function player(id: string): Player {
  return { id, firstName: id, lastName: '', nickname: id, playerClass: 'B' }
}

/**
 * 9-hole day, all par 4s: a shoots 3s (birdie machine), others shoot 4s.
 * Swing team a+b, no downs, $1/hole -> a,b +9 and c,d -9.
 */
function day(id: string, date: string): GameDay {
  return {
    id,
    date,
    course: 'Test GC',
    holeCount: 9,
    pars: Array(9).fill(4),
    attendeeIds: ['a', 'b', 'c', 'd'],
    swingEntrantIds: ['a', 'b', 'c', 'd'],
    swingTeamIds: ['a', 'b'],
    swing: { enabled: true, dollarsPerHole: 1, downsN: 0, stacking: false },
    scores: {
      a: Array(9).fill(3),
      b: Array(9).fill(4),
      c: Array(9).fill(4),
      d: Array(9).fill(4),
    },
  }
}

const players = ['a', 'b', 'c', 'd'].map(player)

describe('chronological', () => {
  it('sorts oldest first regardless of stored order', () => {
    const days = [day('x', '2026-07-01'), day('y', '2026-06-01')]
    expect(chronological(days).map((d) => d.date)).toEqual([
      '2026-06-01',
      '2026-07-01',
    ])
  })
})

describe('careerStats', () => {
  it('accumulates swing money across days in date order', () => {
    const stats = careerStats(players, [
      day('d2', '2026-07-08'),
      day('d1', '2026-07-01'),
    ])
    const a = stats.get('a')!
    expect(a.swingDays).toBe(2)
    expect(a.swingNet).toBe(18)
    expect(a.cumulative.map((p) => p.cum)).toEqual([9, 18])
    expect(a.cumulative.map((p) => p.date)).toEqual([
      '2026-07-01',
      '2026-07-08',
    ])
    expect(stats.get('c')!.swingNet).toBe(-18)
  })

  it('counts rounds, birdies, and vs-par per 18', () => {
    const stats = careerStats(players, [day('d1', '2026-07-01')])
    const a = stats.get('a')!
    expect(a.roundsPlayed).toBe(1)
    expect(a.birdies).toBe(9)
    expect(a.eaglesOrBetter).toBe(0)
    // 9 holes at 1 under each -> -18 per 18 holes
    expect(a.vsParPer18).toBeCloseTo(-18)
    expect(stats.get('b')!.vsParPer18).toBeCloseTo(0)
  })

  it('skips swing money for days that cannot compute, keeps score stats', () => {
    const broken = day('d1', '2026-07-01')
    broken.swingTeamIds = ['a'] // invalid: only one crowned
    const stats = careerStats(players, [broken])
    expect(stats.get('a')!.swingDays).toBe(0)
    expect(stats.get('a')!.swingNet).toBe(0)
    expect(stats.get('a')!.roundsPlayed).toBe(1)
    expect(stats.get('a')!.birdies).toBe(9)
  })

  it('ignores players with no entered scores for round counts', () => {
    const d = day('d1', '2026-07-01')
    const e = player('e')
    const stats = careerStats([...players, e], [d])
    expect(stats.get('e')!.roundsPlayed).toBe(0)
    expect(stats.get('e')!.vsParPer18).toBeNull()
  })
})

describe('daySummaries', () => {
  it('finds the day biggest winner and loser', () => {
    const [summary] = daySummaries([day('d1', '2026-07-01')], players)
    expect(summary.swingOk).toBe(true)
    expect(summary.topWinner!.net).toBe(9)
    expect(summary.topLoser!.net).toBe(-9)
    expect(summary.playersWithScores).toBe(4)
  })

  it('marks incomputable days without blowing up', () => {
    const broken = day('d1', '2026-07-01')
    broken.swing.enabled = false
    const [summary] = daySummaries([broken], players)
    expect(summary.swingOk).toBe(false)
    expect(summary.topWinner).toBeNull()
  })
})
