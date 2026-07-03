/**
 * Birdie / eagle / albatross money: every other entrant in the bet pays
 * the maker the tier amount, per occurrence. Detected from gross scores
 * vs. hole par.
 */

import type { PlayerId } from './types'

export interface BirdiesInput {
  scores: Record<PlayerId, (number | null)[]>
  entrantIds: PlayerId[]
  pars: number[]
  holeCount: number
  amounts: { birdie: number; eagle: number; albatross: number }
}

export type BirdieTier = 'birdie' | 'eagle' | 'albatross'

export interface BirdieEvent {
  hole: number // 1-based
  playerId: PlayerId
  tier: BirdieTier
  /** What this event pays the maker from EACH other entrant. */
  amountEach: number
}

export interface BirdiesResult {
  events: BirdieEvent[]
  /** Sums to zero across entrants. */
  playerNet: Record<PlayerId, number>
}

function tierFor(diff: number): BirdieTier | null {
  if (diff === -1) return 'birdie'
  if (diff === -2) return 'eagle'
  if (diff <= -3) return 'albatross'
  return null
}

export function computeBirdies(input: BirdiesInput): BirdiesResult {
  const { scores, entrantIds, pars, holeCount, amounts } = input
  const events: BirdieEvent[] = []
  const playerNet: Record<PlayerId, number> = {}
  for (const pid of entrantIds) playerNet[pid] = 0

  const payers = entrantIds.length - 1
  if (payers < 1) return { events, playerNet }

  for (const pid of entrantIds) {
    for (let h = 0; h < holeCount; h++) {
      const score = scores[pid]?.[h] ?? null
      if (score == null) continue
      const tier = tierFor(score - (pars[h] ?? 4))
      if (!tier) continue
      const amountEach = amounts[tier]
      if (amountEach <= 0) continue
      events.push({ hole: h + 1, playerId: pid, tier, amountEach })
      playerNet[pid] += amountEach * payers
      for (const other of entrantIds) {
        if (other !== pid) playerNet[other] -= amountEach
      }
    }
  }
  return { events, playerNet }
}
