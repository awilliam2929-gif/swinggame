import { useApp, useCurrentGameDay } from '../store/AppContext'
import { playerLabel } from '../store/types'
import { emptyLine, seedFrom } from '../ui/flavor'

/** Color-code a score cell relative to par. */
function scoreClass(score: number | null, par: number): string {
  if (score == null) return ''
  const diff = score - par
  if (diff <= -2) return 'score-eagle'
  if (diff === -1) return 'score-birdie'
  if (diff === 0) return 'score-par'
  if (diff === 1) return 'score-bogey'
  return 'score-blowup'
}

export default function ScoreEntry() {
  const { state, dispatch } = useApp()
  const gameDay = useCurrentGameDay()

  if (!gameDay) {
    return (
      <section>
        <header className="screen-header">
          <h2>✏️ Scores</h2>
          <p className="subtitle">Start a game day first (Game Day tab).</p>
        </header>
      </section>
    )
  }

  const attendees = state.players
    .filter((p) => gameDay.attendeeIds.includes(p.id))
    .sort((a, b) => playerLabel(a).localeCompare(playerLabel(b)))

  function setScore(pid: string, hole: number, raw: string) {
    if (!gameDay) return
    const value = raw === '' ? null : Number(raw)
    if (value !== null && (!Number.isInteger(value) || value < 1 || value > 20)) {
      return
    }
    const scores = { ...gameDay.scores }
    // Never truncate: holes past the current hole count keep their scores
    // in case the day flips back to 18.
    const row = [...(scores[pid] ?? [])]
    while (row.length < gameDay.holeCount) row.push(null)
    row[hole] = value
    scores[pid] = row
    dispatch({ type: 'updateGameDay', gameDay: { ...gameDay, scores } })
  }

  function totalFor(pid: string): number | null {
    if (!gameDay) return null
    const row = (gameDay.scores[pid] ?? []).slice(0, gameDay.holeCount)
    if (row.length < gameDay.holeCount || row.some((v) => v == null)) {
      return null
    }
    return (row as number[]).reduce((s, v) => s + v, 0)
  }

  const holes = Array.from({ length: gameDay.holeCount }, (_, i) => i)
  const anyScores = Object.values(gameDay.scores).some((row) =>
    row.some((v) => v != null),
  )

  return (
    <section>
      <header className="screen-header">
        <h2>✏️ Scores</h2>
        <p className="subtitle">
          Gross scores only. No handicaps. No mercy. Tab moves across the card.
        </p>
      </header>

      {attendees.length === 0 ? (
        <p className="empty-note">
          Nobody checked in on the Game Day tab yet.
        </p>
      ) : (
        <>
          {!anyScores && (
            <p className="empty-note">{emptyLine(seedFrom(gameDay.id))}</p>
          )}
          <div className="score-scroll">
            <table className="score-table">
              <thead>
                <tr>
                  <th className="sticky-col">Hole</th>
                  {holes.map((h) => (
                    <th key={h}>{h + 1}</th>
                  ))}
                  <th>Total</th>
                </tr>
                <tr className="par-row">
                  <th className="sticky-col">Par</th>
                  {holes.map((h) => (
                    <th key={h}>{gameDay.pars[h]}</th>
                  ))}
                  <th>{gameDay.pars.reduce((s, v) => s + v, 0)}</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((p) => {
                  const row = gameDay.scores[p.id] ?? []
                  const total = totalFor(p.id)
                  return (
                    <tr key={p.id}>
                      <td className="sticky-col nickname">
                        {playerLabel(p)}
                        {gameDay.swingTeamIds.includes(p.id) && ' 👑'}
                      </td>
                      {holes.map((h) => (
                        <td key={h}>
                          <input
                            className={`score-input ${scoreClass(
                              row[h] ?? null,
                              gameDay.pars[h],
                            )}`}
                            inputMode="numeric"
                            maxLength={2}
                            value={row[h] ?? ''}
                            onChange={(e) => setScore(p.id, h, e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                        </td>
                      ))}
                      <td className="total-cell">{total ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="legend">
            <span className="score-eagle legend-chip">eagle+</span>
            <span className="score-birdie legend-chip">birdie</span>
            <span className="score-par legend-chip">par</span>
            <span className="score-bogey legend-chip">bogey</span>
            <span className="score-blowup legend-chip">other (yikes)</span>
          </div>
        </>
      )}
    </section>
  )
}
