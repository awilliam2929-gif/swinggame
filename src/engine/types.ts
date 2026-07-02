/**
 * Core types for the Swing Game engine.
 *
 * Everything here is derived data: the engine is a set of pure functions
 * from (scores, config) -> results. See SPEC.md section 2.
 */

export type PlayerId = string

/** Hole outcome from the perspective of the two teams in a match. */
export type HoleOutcome = 'SWING' | 'OPP' | 'PUSH'

export type HoleCount = 9 | 18

export interface DownsConfig {
  /** Losing this many consecutive holes spawns a new bet. 0 = downs off. */
  n: number
  /**
   * false (standard): the streak counter resets after spawning a bet.
   * true (stacking): sliding window — every additional consecutive loss
   * past the trigger spawns another bet.
   */
  stacking: boolean
}

export interface SwingConfig {
  holeCount: HoleCount
  dollarsPerHole: number
  downs: DownsConfig
}

/** One bet within a match: the original, or one spawned by a downs trigger. */
export interface Bet {
  /** 1-based hole the bet starts on. The original bet starts on hole 1. */
  startHole: number
  /** Which side's losing streak spawned it ('ORIGINAL' for the base bet). */
  trigger: 'ORIGINAL' | 'SWING' | 'OPP'
}

export interface BetResult extends Bet {
  holesWonSwing: number
  holesWonOpp: number
  /** Dollars from the Swing Team's perspective: (won - lost) x $/hole. */
  valueSwing: number
}

export interface MatchResult {
  /** The two players forming this opposing combination. */
  opponents: [PlayerId, PlayerId]
  /** Hole-by-hole best-ball outcomes for this match. */
  outcomes: HoleOutcome[]
  bets: BetResult[]
  /**
   * Match total in dollars from the Swing Team's perspective.
   * Money is per player: each opponent pays this amount (or collects it,
   * if negative) and each Swing Team member collects (or pays) it.
   */
  totalSwing: number
}

export interface SwingGameResult {
  swingTeam: [PlayerId, PlayerId]
  matches: MatchResult[]
  /** Net dollars per player across all matches. Sums to zero. */
  playerNet: Record<PlayerId, number>
}

/** Gross scores per player, one entry per hole (index 0 = hole 1). */
export type Scores = Record<PlayerId, number[]>
