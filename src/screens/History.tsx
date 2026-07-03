import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext'
import { playerLabel } from '../store/types'
import { careerStats, chronological, daySummaries } from '../ui/stats'
import type { CumulativePoint } from '../ui/stats'
import { money, signedMoney } from '../ui/money'

interface TooltipState {
  x: number
  y: number
  lines: string[]
}

function CumulativeChart({
  points,
  name,
}: {
  points: CumulativePoint[]
  name: string
}) {
  const [tip, setTip] = useState<TooltipState | null>(null)

  const W = 720
  const H = 240
  const PAD = { top: 18, right: 70, bottom: 26, left: 54 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const values = points.map((p) => p.cum)
  const lo = Math.min(0, ...values)
  const hi = Math.max(0, ...values)
  const span = hi - lo || 1
  const x = (i: number) =>
    PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const y = (v: number) => PAD.top + ((hi - v) / span) * innerH

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.cum)}`).join(' ')
  const last = points[points.length - 1]

  // A few horizontal gridlines: lo, 0, hi (deduped)
  const gridValues = [...new Set([lo, 0, hi])]

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="line-chart" role="img"
        aria-label={`Cumulative swing money over time for ${name}`}>
        {gridValues.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)}
              className={v === 0 ? 'grid zero' : 'grid'}
            />
            <text x={PAD.left - 8} y={y(v) + 4} className="axis-label" textAnchor="end">
              {v < 0 ? `−${money(Math.abs(v))}` : money(v)}
            </text>
          </g>
        ))}
        <path d={path} className="series-line" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.cum)} r={4.5} className="series-dot" />
            <circle
              cx={x(i)} cy={y(p.cum)} r={14} fill="transparent"
              onMouseEnter={() =>
                setTip({
                  x: (x(i) / W) * 100,
                  y: (y(p.cum) / H) * 100,
                  lines: [p.label, `day: ${signedMoney(p.net)}`, `total: ${signedMoney(p.cum)}`],
                })
              }
              onMouseLeave={() => setTip(null)}
            />
          </g>
        ))}
        {last && (
          <text
            x={Math.min(x(points.length - 1) + 10, W - PAD.right - 48)}
            y={y(last.cum) + 4}
            className={`end-label ${last.cum >= 0 ? 'pos' : 'neg'}`}
            textAnchor="start"
          >
            {signedMoney(last.cum)}
          </text>
        )}
      </svg>
      {tip && (
        <div className="chart-tip" style={{ left: `${tip.x}%`, top: `${tip.y}%` }}>
          {tip.lines.map((l, i) => (
            <div key={i} className={i === 0 ? 'tip-title' : ''}>{l}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function History() {
  const { state, dispatch } = useApp()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const summaries = useMemo(
    () => daySummaries(chronological(state.gameDays).reverse(), state.players),
    [state.gameDays, state.players],
  )
  const stats = useMemo(
    () => careerStats(state.players, state.gameDays),
    [state.players, state.gameDays],
  )

  const byId = new Map(state.players.map((p) => [p.id, p]))
  const name = (id: string) => {
    const p = byId.get(id)
    return p ? playerLabel(p) : '(deleted player)'
  }

  const board = state.players
    .map((p) => stats.get(p.id)!)
    .filter((s) => s.roundsPlayed > 0 || s.swingDays > 0)
    .sort((a, b) => b.swingNet - a.swingNet)
  const maxAbs = Math.max(1, ...board.map((s) => Math.abs(s.swingNet)))

  const selected = selectedId ? stats.get(selectedId) : null

  return (
    <section className="history-screen">
      <header className="screen-header">
        <h2>History</h2>
        <p className="subtitle">
          The long con. Every game day logged, every dollar remembered.
        </p>
      </header>

      <div className="desktop-split desktop-split-history">
        <div className="desktop-split-main">
          <div className="card">
            <h3>Career money (Swing Game)</h3>
            {board.length === 0 ? (
              <p className="empty-note">
                No completed game days yet. History is written by the winners —
                once there&apos;s history.
              </p>
            ) : (
              <>
                <p className="hint">
                  Click a player to see their money graph. Won{' '}
                  <span className="swatch pos" /> · lost <span className="swatch neg" />
                </p>
                <table className="career-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th className="num">Rounds</th>
                      <th className="num">Birdies</th>
                      <th className="num">Eagles+</th>
                      <th className="num">vs par /18</th>
                      <th className="bar-col"></th>
                      <th className="num">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {board.map((s) => (
                      <tr
                        key={s.playerId}
                        className={selectedId === s.playerId ? 'selected' : ''}
                        onClick={() =>
                          setSelectedId(selectedId === s.playerId ? null : s.playerId)
                        }
                      >
                        <td className="nickname">{name(s.playerId)}</td>
                        <td className="num">{s.roundsPlayed}</td>
                        <td className="num">{s.birdies}</td>
                        <td className="num">{s.eaglesOrBetter > 0 ? s.eaglesOrBetter : '—'}</td>
                        <td className="num">
                          {s.vsParPer18 == null
                            ? '—'
                            : `${s.vsParPer18 >= 0 ? '+' : ''}${s.vsParPer18.toFixed(1)}`}
                        </td>
                        <td className="bar-col">
                          <div className="diverge-bar">
                            <div className="half left">
                              {s.swingNet < 0 && (
                                <div
                                  className="bar neg"
                                  style={{ width: `${(Math.abs(s.swingNet) / maxAbs) * 100}%` }}
                                />
                              )}
                            </div>
                            <div className="half right">
                              {s.swingNet > 0 && (
                                <div
                                  className="bar pos"
                                  style={{ width: `${(s.swingNet / maxAbs) * 100}%` }}
                                />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`num net ${s.swingNet > 0.005 ? 'pos' : s.swingNet < -0.005 ? 'neg' : ''}`}>
                          {signedMoney(s.swingNet)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>

        <div className="desktop-split-aside desktop-sticky-aside">
          {selected && selected.cumulative.length > 0 ? (
            <div className="card history-detail-panel">
              <h3>
                {name(selected.playerId)} — cumulative (
                {selected.swingDays} {selected.swingDays === 1 ? 'day' : 'days'})
              </h3>
              <CumulativeChart
                points={selected.cumulative}
                name={name(selected.playerId)}
              />
            </div>
          ) : selected && selected.cumulative.length === 0 ? (
            <div className="card history-detail-panel">
              <h3>{name(selected.playerId)}</h3>
              <p className="empty-note">
                Scores logged but no completed Swing Game days yet.
              </p>
            </div>
          ) : (
            <div className="card history-detail-panel history-detail-empty">
              <h3>Player chart</h3>
              <p className="hint">
                Select a player from the career table to see their cumulative swing
                money over time.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Game day log</h3>
        {summaries.length === 0 ? (
          <p className="empty-note">Nothing logged yet.</p>
        ) : (
          <table className="log-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th className="num">Holes</th>
                <th className="num">Cards</th>
                <th>🤑 Big winner</th>
                <th>🩸 Big loser</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {summaries.map(({ gameDay, playersWithScores, swingOk, topWinner, topLoser }) => (
                <tr key={gameDay.id}>
                  <td>{gameDay.date}</td>
                  <td>{gameDay.course || '—'}</td>
                  <td className="num">{gameDay.holeCount}</td>
                  <td className="num">{playersWithScores}</td>
                  <td>
                    {swingOk && topWinner ? (
                      <>
                        {name(topWinner.id)}{' '}
                        <span className="net pos">{signedMoney(topWinner.net)}</span>
                      </>
                    ) : (
                      <span className="hint">incomplete</span>
                    )}
                  </td>
                  <td>
                    {swingOk && topLoser ? (
                      <>
                        {name(topLoser.id)}{' '}
                        <span className="net neg">{signedMoney(topLoser.net)}</span>
                      </>
                    ) : (
                      <span className="hint">incomplete</span>
                    )}
                  </td>
                  <td className="row-actions">
                    <button
                      className="btn small"
                      onClick={() => dispatch({ type: 'selectGameDay', id: gameDay.id })}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="hint">
          "Open" loads that day into the Game Day / Scores / Results / Pay Up
          tabs.
        </p>
      </div>
    </section>
  )
}
