/**
 * Cross-game-day stats: the "over time" layer. Pure functions over the
 * stored game days — nothing here is persisted, it's all derived.
 */

import type { GameDay, Player } from '../store/types'
import { computeSwing } from './compute'

export interface DaySummary {
  gameDay: GameDay
  playersWithScores: number
  swingOk: boolean
  topWinner: { id: string; net: number } | null
  topLoser: { id: string; net: number } | null
}

export interface CumulativePoint {
  date: string
  label: string
  net: number
  cum: number
}

export interface CareerStats {
  playerId: string
  roundsPlayed: number
  swingDays: number
  swingNet: number
  holesRecorded: number
  /** Average strokes over/under par per 18 holes; null with no data. */
  vsParPer18: number | null
  birdies: number
  eaglesOrBetter: number
  cumulative: CumulativePoint[]
}

/** Oldest first, so cumulative series read left to right. */
export function chronological(gameDays: GameDay[]): GameDay[] {
  return [...gameDays].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  )
}

export function daySummaries(
  gameDays: GameDay[],
  players: Player[],
): DaySummary[] {
  return gameDays.map((gameDay) => {
    const playersWithScores = Object.values(gameDay.scores).filter((row) =>
      row.some((v) => v != null),
    ).length
    const computed = computeSwing(gameDay, players)
    if (!computed.ok) {
      return {
        gameDay,
        playersWithScores,
        swingOk: false,
        topWinner: null,
        topLoser: null,
      }
    }
    const entries = Object.entries(computed.result.playerNet)
    let topWinner: DaySummary['topWinner'] = null
    let topLoser: DaySummary['topLoser'] = null
    for (const [id, net] of entries) {
      if (!topWinner || net > topWinner.net) topWinner = { id, net }
      if (!topLoser || net < topLoser.net) topLoser = { id, net }
    }
    return { gameDay, playersWithScores, swingOk: true, topWinner, topLoser }
  })
}

export function careerStats(
  players: Player[],
  gameDays: GameDay[],
): Map<string, CareerStats> {
  const stats = new Map<string, CareerStats>()
  for (const p of players) {
    stats.set(p.id, {
      playerId: p.id,
      roundsPlayed: 0,
      swingDays: 0,
      swingNet: 0,
      holesRecorded: 0,
      vsParPer18: null,
      birdies: 0,
      eaglesOrBetter: 0,
      cumulative: [],
    })
  }

  const vsParTotal = new Map<string, number>()

  for (const gameDay of chronological(gameDays)) {
    const computed = computeSwing(gameDay, players)
    for (const p of players) {
      const s = stats.get(p.id)!
      const row = (gameDay.scores[p.id] ?? []).slice(0, gameDay.holeCount)
      const holesEntered = row.filter((v) => v != null).length
      if (holesEntered > 0) {
        s.roundsPlayed++
        s.holesRecorded += holesEntered
        row.forEach((score, h) => {
          if (score == null) return
          const par = gameDay.pars[h] ?? 4
          vsParTotal.set(p.id, (vsParTotal.get(p.id) ?? 0) + (score - par))
          if (score - par === -1) s.birdies++
          if (score - par <= -2) s.eaglesOrBetter++
        })
      }
      if (computed.ok && p.id in computed.result.playerNet) {
        const net = computed.result.playerNet[p.id]
        s.swingDays++
        s.swingNet += net
        s.cumulative.push({
          date: gameDay.date,
          label: gameDay.course
            ? `${gameDay.date} · ${gameDay.course}`
            : gameDay.date,
          net,
          cum: s.swingNet,
        })
      }
    }
  }

  for (const s of stats.values()) {
    if (s.holesRecorded > 0) {
      s.vsParPer18 = ((vsParTotal.get(s.playerId) ?? 0) / s.holesRecorded) * 18
    }
  }
  return stats
}
