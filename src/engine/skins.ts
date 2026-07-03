/**
 * Skins pot — with greenies paid from the same bucket.
 *
 * Everyone in the game antes into one pot. A skin is the outright lowest
 * gross score on a hole among entrants (ties = no skin, no carryover).
 * When greenies are on, each closest-to-the-pin win on a par 3 is one
 * share of the same pot, equal in value to a skin. Payout: pot divided by
 * total shares won. No shares -> everyone gets the ante back.
 */

import type { PlayerId } from './types'

export interface SkinsInput {
  /** Gross scores per player (null = not entered). */
  scores: Record<PlayerId, (number | null)[]>
  entrantIds: PlayerId[]
  pars: number[]
  holeCount: number
  ante: number
  greeniesEnabled: boolean
  /** CTP winner per 0-based par-3 hole index (absent/null = nobody). */
  greenieWinners: Record<number, PlayerId | null>
}

export interface PotShare {
  hole: number // 1-based for display
  playerId: PlayerId
  kind: 'skin' | 'greenie'
  score?: number
}

export interface SkinsResult {
  shares: PotShare[]
  pot: number
  /** Dollar value of one share; 0 when no shares were won. */
  shareValue: number
  /** Ante refunded because nothing was won. */
  refunded: boolean
  /** Winnings minus ante per entrant. Sums to zero. */
  playerNet: Record<PlayerId, number>
  /** 1-based holes that can't be scored yet (missing entrant scores). */
  pendingHoles: number[]
}

export function computeSkins(input: SkinsInput): SkinsResult {
  const {
    scores,
    entrantIds,
    pars,
    holeCount,
    ante,
    greeniesEnabled,
    greenieWinners,
  } = input

  const shares: PotShare[] = []
  const pendingHoles: number[] = []

  for (let h = 0; h < holeCount; h++) {
    const holeScores: { playerId: PlayerId; score: number }[] = []
    let missing = false
    for (const pid of entrantIds) {
      const score = scores[pid]?.[h] ?? null
      if (score == null) {
        missing = true
        break
      }
      holeScores.push({ playerId: pid, score })
    }
    if (missing) {
      pendingHoles.push(h + 1)
      continue
    }
    const low = Math.min(...holeScores.map((s) => s.score))
    const lowest = holeScores.filter((s) => s.score === low)
    if (lowest.length === 1) {
      shares.push({
        hole: h + 1,
        playerId: lowest[0].playerId,
        kind: 'skin',
        score: low,
      })
    }
  }

  if (greeniesEnabled) {
    for (let h = 0; h < holeCount; h++) {
      if (pars[h] !== 3) continue
      const winner = greenieWinners[h]
      if (winner && entrantIds.includes(winner)) {
        shares.push({ hole: h + 1, playerId: winner, kind: 'greenie' })
      }
    }
  }

  const pot = ante * entrantIds.length
  const refunded = shares.length === 0
  const shareValue = refunded ? 0 : pot / shares.length

  const playerNet: Record<PlayerId, number> = {}
  for (const pid of entrantIds) playerNet[pid] = refunded ? 0 : -ante
  if (!refunded) {
    for (const share of shares) playerNet[share.playerId] += shareValue
  }

  return { shares, pot, shareValue, refunded, playerNet, pendingHoles }
}
