import { settleSwingGame } from '../engine/swing'
import type { Scores, SwingGameResult } from '../engine/types'
import type { GameDay, Player } from '../store/types'
import { playerLabel } from '../store/types'

export type SwingComputation =
  | { ok: true; result: SwingGameResult }
  | { ok: false; reason: string }

/** Assemble scores and run the Swing Game, or explain why we can't yet. */
export function computeSwing(
  gameDay: GameDay,
  players: Player[],
): SwingComputation {
  if (!gameDay.swing.enabled) {
    return { ok: false, reason: 'The Swing Game is toggled off for this day.' }
  }
  if (gameDay.swingTeamIds.length !== 2) {
    return {
      ok: false,
      reason: 'Crown exactly two players as the Swing Team on the Game Day tab.',
    }
  }
  if (gameDay.swingEntrantIds.length < 4) {
    return {
      ok: false,
      reason: 'Need at least 4 players in the pot (the Swing Team + 2 more).',
    }
  }

  const byId = new Map(players.map((p) => [p.id, p]))
  const missing: string[] = []
  const scores: Scores = {}
  for (const pid of gameDay.swingEntrantIds) {
    const row = gameDay.scores[pid] ?? []
    const complete =
      row.length >= gameDay.holeCount &&
      row.slice(0, gameDay.holeCount).every((v) => v != null)
    if (!complete) {
      const p = byId.get(pid)
      missing.push(p ? playerLabel(p) : 'unknown player')
    } else {
      scores[pid] = row.slice(0, gameDay.holeCount) as number[]
    }
  }
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Still waiting on complete scorecards for: ${missing.join(', ')}.`,
    }
  }

  try {
    const result = settleSwingGame(
      scores,
      gameDay.swingEntrantIds,
      gameDay.swingTeamIds as [string, string],
      {
        holeCount: gameDay.holeCount,
        dollarsPerHole: gameDay.swing.dollarsPerHole,
        downs: { n: gameDay.swing.downsN, stacking: gameDay.swing.stacking },
      },
    )
    return { ok: true, result }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}
