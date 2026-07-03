import { useCallback, useMemo, useRef, useState } from 'react'
import { useApp, useCurrentGameDay } from '../store/AppContext'
import { playerLabel, sideBetsFor } from '../store/types'
import { emptyLine, seedFrom } from '../ui/flavor'

type HoleView = 'all' | 'front' | 'back'

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

function holeRange(holeCount: number, view: HoleView): number[] {
  if (holeCount === 18 && view === 'front') {
    return Array.from({ length: 9 }, (_, i) => i)
  }
  if (holeCount === 18 && view === 'back') {
    return Array.from({ length: 9 }, (_, i) => i + 9)
  }
  return Array.from({ length: holeCount }, (_, i) => i)
}

export default function ScoreEntry() {
  const { state, dispatch } = useApp()
  const gameDay = useCurrentGameDay()
  const [holeView, setHoleView] = useState<HoleView>('all')
  const [focusCell, setFocusCell] = useState<{ row: number; col: number } | null>(
    null,
  )
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([])

  const attendees = useMemo(
    () =>
      gameDay
        ? state.players
            .filter((p) => gameDay.attendeeIds.includes(p.id))
            .sort((a, b) => playerLabel(a).localeCompare(playerLabel(b)))
        : [],
    [gameDay, state.players],
  )

  const visibleHoles = useMemo(
    () => (gameDay ? holeRange(gameDay.holeCount, holeView) : []),
    [gameDay, holeView],
  )

  const setScore = useCallback(
    (pid: string, hole: number, raw: string) => {
      if (!gameDay) return
      const value = raw === '' ? null : Number(raw)
      if (value !== null && (!Number.isInteger(value) || value < 1 || value > 20)) {
        return
      }
      const scores = { ...gameDay.scores }
      const row = [...(scores[pid] ?? [])]
      while (row.length < gameDay.holeCount) row.push(null)
      row[hole] = value
      scores[pid] = row
      dispatch({ type: 'updateGameDay', gameDay: { ...gameDay, scores } })
    },
    [gameDay, dispatch],
  )

  const focusInput = useCallback((row: number, col: number) => {
    const el = inputRefs.current[row]?.[col]
    if (el) {
      el.focus()
      el.select()
      setFocusCell({ row, col })
    }
  }, [])

  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      row: number,
      col: number,
      pid: string,
      hole: number,
    ) => {
      if (!gameDay) return
      const par = gameDay.pars[hole]

      if (e.key === '.' || e.key === ' ') {
        e.preventDefault()
        setScore(pid, hole, String(par))
        return
      }

      if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
        if (e.key === 'ArrowRight') e.preventDefault()
        if (e.key === 'Tab') {
          if (col < visibleHoles.length - 1) {
            e.preventDefault()
          }
        }
        if (col < visibleHoles.length - 1) focusInput(row, col + 1)
        return
      }

      if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
        if (e.key === 'ArrowLeft') e.preventDefault()
        if (e.key === 'Tab') {
          if (col > 0) e.preventDefault()
        }
        if (col > 0) focusInput(row, col - 1)
        return
      }

      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        if (row + 1 < attendees.length) focusInput(row + 1, col)
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (row > 0) focusInput(row - 1, col)
      }
    },
    [gameDay, attendees.length, visibleHoles.length, setScore, focusInput],
  )

  if (!gameDay) {
    return (
      <section>
        <header className="screen-header">
          <h2>Scores</h2>
          <p className="subtitle">Start a game day first (Game Day tab).</p>
        </header>
      </section>
    )
  }

  const day = gameDay

  function totalFor(pid: string): number | null {
    const row = (day.scores[pid] ?? []).slice(0, day.holeCount)
    if (row.length < day.holeCount || row.some((v) => v == null)) {
      return null
    }
    return (row as number[]).reduce((s, v) => s + v, 0)
  }

  const anyScores = Object.values(day.scores).some((row) =>
    row.some((v) => v != null),
  )

  const completeCards = attendees.filter((p) => totalFor(p.id) != null).length
  const totalCells = attendees.length * day.holeCount
  const filledCells = attendees.reduce((n, p) => {
    const row = day.scores[p.id] ?? []
    for (let h = 0; h < day.holeCount; h++) {
      if (row[h] != null) n++
    }
    return n
  }, 0)

  inputRefs.current.length = attendees.length
  for (let r = 0; r < attendees.length; r++) {
    if (!inputRefs.current[r]) inputRefs.current[r] = []
    inputRefs.current[r].length = visibleHoles.length
  }

  const parTotal =
    holeView === 'all'
      ? day.pars.slice(0, day.holeCount).reduce((s, v) => s + v, 0)
      : visibleHoles.reduce((s, h) => s + day.pars[h], 0)

  return (
    <section className="score-entry">
      <header className="screen-header">
        <h2>Scores</h2>
        <p className="subtitle">
          Gross scores only. Arrows move the grid; <kbd>.</kbd> or{' '}
          <kbd>Space</kbd> fills par.
        </p>
      </header>

      {attendees.length === 0 ? (
        <p className="empty-note">
          Nobody checked in on the Game Day tab yet.
        </p>
      ) : (
        <>
          {!anyScores && (
            <p className="empty-note">{emptyLine(seedFrom(day.id))}</p>
          )}

          <div className="score-toolbar">
            <div className="score-progress">
              <span className="score-progress-label">Progress</span>
              <span className="score-progress-value">
                {completeCards}/{attendees.length} cards · {filledCells}/
                {totalCells} scores
              </span>
              <div
                className="score-progress-bar"
                role="progressbar"
                aria-valuenow={filledCells}
                aria-valuemin={0}
                aria-valuemax={totalCells}
              >
                <div
                  className="score-progress-fill"
                  style={{
                    width: `${totalCells ? (filledCells / totalCells) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {day.holeCount === 18 && (
              <div className="segmented score-nine-toggle" role="group" aria-label="Hole range">
                {(
                  [
                    ['all', 'All 18'],
                    ['front', 'Front 9'],
                    ['back', 'Back 9'],
                  ] as const
                ).map(([view, label]) => (
                  <button
                    key={view}
                    type="button"
                    className={holeView === view ? 'seg active' : 'seg'}
                    onClick={() => setHoleView(view)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="score-scroll">
            <table className="score-table">
              <thead>
                <tr>
                  <th className="sticky-col">Player</th>
                  {visibleHoles.map((h, col) => (
                    <th
                      key={h}
                      className={focusCell?.col === col ? 'score-col-focus' : ''}
                    >
                      {h + 1}
                    </th>
                  ))}
                  {holeView === 'all' && <th>Total</th>}
                </tr>
                <tr className="par-row">
                  <th className="sticky-col">Par</th>
                  {visibleHoles.map((h, col) => (
                    <th
                      key={h}
                      className={focusCell?.col === col ? 'score-col-focus' : ''}
                    >
                      {gameDay.pars[h]}
                    </th>
                  ))}
                  {holeView === 'all' && <th>{parTotal}</th>}
                </tr>
              </thead>
              <tbody>
                {attendees.map((p, row) => {
                  const rowScores = gameDay.scores[p.id] ?? []
                  const total = totalFor(p.id)
                  const rowFocused = focusCell?.row === row
                  return (
                    <tr
                      key={p.id}
                      className={rowFocused ? 'score-row-focus' : ''}
                    >
                      <td className="sticky-col nickname">
                        {playerLabel(p)}
                        {gameDay.swingTeamIds.includes(p.id) && (
                          <span className="swing-crown" title="Swing Team">
                            👑
                          </span>
                        )}
                      </td>
                      {visibleHoles.map((h, col) => (
                        <td
                          key={h}
                          className={focusCell?.col === col ? 'score-col-focus' : ''}
                        >
                          <input
                            ref={(el) => {
                              inputRefs.current[row][col] = el
                            }}
                            className={`score-input ${scoreClass(
                              rowScores[h] ?? null,
                              gameDay.pars[h],
                            )}`}
                            inputMode="numeric"
                            maxLength={2}
                            aria-label={`${playerLabel(p)}, hole ${h + 1}`}
                            value={rowScores[h] ?? ''}
                            onChange={(e) => setScore(p.id, h, e.target.value)}
                            onFocus={() => setFocusCell({ row, col })}
                            onBlur={() =>
                              setFocusCell((prev) =>
                                prev?.row === row && prev?.col === col
                                  ? null
                                  : prev,
                              )
                            }
                            onKeyDown={(e) => handleKeyDown(e, row, col, p.id, h)}
                          />
                        </td>
                      ))}
                      {holeView === 'all' && (
                        <td className="total-cell">{total ?? '—'}</td>
                      )}
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
            <span className="score-blowup legend-chip">double+</span>
          </div>
          <GreenieEntry />
        </>
      )}
    </section>
  )
}

/** One CTP winner pick per par 3, feeding the skins & greenies pot. */
function GreenieEntry() {
  const { state, dispatch } = useApp()
  const gameDay = useCurrentGameDay()
  if (!gameDay) return null

  const sideBets = sideBetsFor(gameDay)
  if (!sideBets.skins.enabled || !sideBets.skins.greenies) return null

  const parThrees = gameDay.pars
    .slice(0, gameDay.holeCount)
    .map((par, i) => ({ par, hole: i }))
    .filter(({ par }) => par === 3)

  const potPlayers = state.players
    .filter((p) => sideBets.skins.entrantIds.includes(p.id))
    .sort((a, b) => playerLabel(a).localeCompare(playerLabel(b)))

  function setWinner(hole: number, pid: string) {
    if (!gameDay) return
    dispatch({
      type: 'updateGameDay',
      gameDay: {
        ...gameDay,
        greenieWinners: {
          ...gameDay.greenieWinners,
          [hole]: pid === '' ? null : pid,
        },
      },
    })
  }

  return (
    <div className="card score-greenies">
      <h3>Greenies (closest to the pin)</h3>
      {parThrees.length === 0 ? (
        <p className="hint">
          No par 3s on the card — set hole pars on the Game Day tab first.
        </p>
      ) : potPlayers.length === 0 ? (
        <p className="hint">
          Nobody&apos;s in the skins pot yet — pick the pot players on the Game Day
          tab.
        </p>
      ) : (
        <>
          <p className="hint">
            Each greenie is one share of the skins pot. Leave blank if nobody
            hit the green.
          </p>
          <div className="field-row">
            {parThrees.map(({ hole }) => (
              <label key={hole}>
                Hole {hole + 1}
                <select
                  value={gameDay.greenieWinners?.[hole] ?? ''}
                  onChange={(e) => setWinner(hole, e.target.value)}
                >
                  <option value="">— nobody</option>
                  {potPlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {playerLabel(p)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
