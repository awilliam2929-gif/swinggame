/**
 * Swing Game calculation engine. Pure functions only — no I/O, no state.
 * Rules: SPEC.md section 2.
 */

import type {
  Bet,
  BetResult,
  DownsConfig,
  HoleOutcome,
  MatchResult,
  PlayerId,
  Scores,
  SwingConfig,
  SwingGameResult,
} from './types'

/** All 2-player combinations of a list, preserving input order. */
export function combinations(players: PlayerId[]): [PlayerId, PlayerId][] {
  const out: [PlayerId, PlayerId][] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      out.push([players[i], players[j]])
    }
  }
  return out
}

/** Best ball: the lower of the two players' gross scores on each hole. */
export function bestBall(
  scores: Scores,
  team: [PlayerId, PlayerId],
  holeCount: number,
): number[] {
  const [a, b] = team
  for (const p of team) {
    if (!scores[p] || scores[p].length < holeCount) {
      throw new Error(`Missing scores for player ${p}`)
    }
  }
  const out: number[] = []
  for (let h = 0; h < holeCount; h++) {
    out.push(Math.min(scores[a][h], scores[b][h]))
  }
  return out
}

/** Hole-by-hole outcomes of one match from the Swing Team's perspective. */
export function holeOutcomes(
  swingBest: number[],
  oppBest: number[],
): HoleOutcome[] {
  return swingBest.map((s, h) => {
    const o = oppBest[h]
    if (s < o) return 'SWING'
    if (s > o) return 'OPP'
    return 'PUSH'
  })
}

/**
 * The original bet plus every bet spawned by downs triggers.
 *
 * A push resets both streaks. A bet triggered on the final hole would start
 * past the end of the round and is not created. Spawned bets never generate
 * their own triggers — only raw hole results do.
 */
export function spawnBets(outcomes: HoleOutcome[], downs: DownsConfig): Bet[] {
  const bets: Bet[] = [{ startHole: 1, trigger: 'ORIGINAL' }]
  if (downs.n <= 0) return bets

  let swingStreak = 0
  let oppStreak = 0
  outcomes.forEach((outcome, i) => {
    if (outcome === 'PUSH') {
      swingStreak = 0
      oppStreak = 0
      return
    }
    const swingLost = outcome === 'OPP'
    if (swingLost) {
      swingStreak++
      oppStreak = 0
    } else {
      oppStreak++
      swingStreak = 0
    }
    const streak = swingLost ? swingStreak : oppStreak
    const triggered = downs.stacking ? streak >= downs.n : streak === downs.n
    if (triggered) {
      const startHole = i + 2 // the hole after the one just lost
      if (startHole <= outcomes.length) {
        bets.push({ startHole, trigger: swingLost ? 'SWING' : 'OPP' })
      }
      if (!downs.stacking) {
        if (swingLost) swingStreak = 0
        else oppStreak = 0
      }
    }
  })
  return bets
}

/** Tally one bet over the holes it covers (its start hole to the end). */
export function scoreBet(
  outcomes: HoleOutcome[],
  bet: Bet,
  dollarsPerHole: number,
): BetResult {
  let holesWonSwing = 0
  let holesWonOpp = 0
  for (let h = bet.startHole - 1; h < outcomes.length; h++) {
    if (outcomes[h] === 'SWING') holesWonSwing++
    else if (outcomes[h] === 'OPP') holesWonOpp++
  }
  return {
    ...bet,
    holesWonSwing,
    holesWonOpp,
    valueSwing: (holesWonSwing - holesWonOpp) * dollarsPerHole,
  }
}

/** One full match: Swing Team vs one opposing 2-player combination. */
export function settleMatch(
  scores: Scores,
  swingTeam: [PlayerId, PlayerId],
  opponents: [PlayerId, PlayerId],
  config: SwingConfig,
): MatchResult {
  const outcomes = holeOutcomes(
    bestBall(scores, swingTeam, config.holeCount),
    bestBall(scores, opponents, config.holeCount),
  )
  const bets = spawnBets(outcomes, config.downs).map((bet) =>
    scoreBet(outcomes, bet, config.dollarsPerHole),
  )
  return {
    opponents,
    outcomes,
    bets,
    totalSwing: bets.reduce((sum, b) => sum + b.valueSwing, 0),
  }
}

/**
 * The whole Swing Game: the Swing Team against every 2-player combination
 * of the other entrants. Money is per player (see MatchResult.totalSwing),
 * so playerNet always sums to zero.
 */
export function settleSwingGame(
  scores: Scores,
  entrants: PlayerId[],
  swingTeam: [PlayerId, PlayerId],
  config: SwingConfig,
): SwingGameResult {
  const [s1, s2] = swingTeam
  if (!entrants.includes(s1) || !entrants.includes(s2)) {
    throw new Error('Swing Team members must be entrants')
  }
  const others = entrants.filter((p) => p !== s1 && p !== s2)
  if (others.length < 2) {
    throw new Error('Need at least 2 non-Swing entrants to form a match')
  }

  const playerNet: Record<PlayerId, number> = {}
  for (const p of entrants) playerNet[p] = 0

  const matches = combinations(others).map((opponents) => {
    const match = settleMatch(scores, swingTeam, opponents, config)
    playerNet[s1] += match.totalSwing
    playerNet[s2] += match.totalSwing
    playerNet[opponents[0]] -= match.totalSwing
    playerNet[opponents[1]] -= match.totalSwing
    return match
  })

  return { swingTeam, matches, playerNet }
}
