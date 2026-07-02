import { useState } from 'react'
import type { HoleCount } from '../engine/types'
import { useApp, useCurrentGameDay } from '../store/AppContext'
import {
  newGameDay,
  playerLabel,
  type GameDay,
  type Player,
} from '../store/types'
import { PlayerForm } from './Roster'

export default function GameDaySetup() {
  const { state, dispatch } = useApp()
  const gameDay = useCurrentGameDay()
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  function update(patch: Partial<GameDay>) {
    if (!gameDay) return
    dispatch({ type: 'updateGameDay', gameDay: { ...gameDay, ...patch } })
  }

  // Arrays only grow so switching 18 -> 9 -> 18 never loses entered data;
  // screens and the engine read just the first holeCount entries.
  function setHoleCount(holeCount: HoleCount) {
    if (!gameDay) return
    const parLen = Math.max(holeCount, gameDay.pars.length)
    const pars = Array.from({ length: parLen }, (_, i) => gameDay.pars[i] ?? 4)
    const scores: GameDay['scores'] = {}
    for (const [pid, arr] of Object.entries(gameDay.scores)) {
      const len = Math.max(holeCount, arr.length)
      scores[pid] = Array.from({ length: len }, (_, i) => arr[i] ?? null)
    }
    update({ holeCount, pars, scores })
  }

  function toggleAttendee(p: Player) {
    if (!gameDay) return
    const isIn = gameDay.attendeeIds.includes(p.id)
    update({
      attendeeIds: isIn
        ? gameDay.attendeeIds.filter((id) => id !== p.id)
        : [...gameDay.attendeeIds, p.id],
      swingEntrantIds: isIn
        ? gameDay.swingEntrantIds.filter((id) => id !== p.id)
        : gameDay.swingEntrantIds,
      swingTeamIds: isIn
        ? gameDay.swingTeamIds.filter((id) => id !== p.id)
        : gameDay.swingTeamIds,
    })
  }

  function toggleSwingEntrant(pid: string) {
    if (!gameDay) return
    const isIn = gameDay.swingEntrantIds.includes(pid)
    update({
      swingEntrantIds: isIn
        ? gameDay.swingEntrantIds.filter((id) => id !== pid)
        : [...gameDay.swingEntrantIds, pid],
      swingTeamIds: isIn
        ? gameDay.swingTeamIds.filter((id) => id !== pid)
        : gameDay.swingTeamIds,
    })
  }

  function toggleSwingTeam(pid: string) {
    if (!gameDay) return
    const isIn = gameDay.swingTeamIds.includes(pid)
    if (isIn) {
      update({ swingTeamIds: gameDay.swingTeamIds.filter((id) => id !== pid) })
    } else if (gameDay.swingTeamIds.length < 2) {
      update({ swingTeamIds: [...gameDay.swingTeamIds, pid] })
    }
  }

  const sortedPlayers = [...state.players].sort((a, b) =>
    playerLabel(a).localeCompare(playerLabel(b)),
  )

  if (!gameDay) {
    return (
      <section>
        <header className="screen-header">
          <h2>📅 Game Day</h2>
          <p className="subtitle">No game day going. Fix that.</p>
        </header>
        <button
          className="btn primary big"
          onClick={() =>
            dispatch({ type: 'createGameDay', gameDay: newGameDay() })
          }
        >
          ⛳ Start a new game day
        </button>
        {state.gameDays.length > 0 && (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3>Old game days</h3>
            <ul className="gameday-list">
              {state.gameDays.map((g) => (
                <li key={g.id}>
                  <button
                    className="btn"
                    onClick={() => dispatch({ type: 'selectGameDay', id: g.id })}
                  >
                    {g.date} {g.course && `— ${g.course}`}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    )
  }

  const attendees = sortedPlayers.filter((p) =>
    gameDay.attendeeIds.includes(p.id),
  )
  const entrants = attendees.filter((p) =>
    gameDay.swingEntrantIds.includes(p.id),
  )

  return (
    <section>
      <header className="screen-header">
        <h2>📅 Game Day</h2>
        <p className="subtitle">
          Set the table. Every dollar owed later starts with a toggle here.
        </p>
      </header>

      <div className="card">
        <h3>The basics</h3>
        <div className="field-row">
          <label>
            Date
            <input
              type="date"
              value={gameDay.date}
              onChange={(e) => update({ date: e.target.value })}
            />
          </label>
          <label>
            Course
            <input
              placeholder="Where the crime happened"
              value={gameDay.course}
              onChange={(e) => update({ course: e.target.value })}
            />
          </label>
          <label>
            Holes
            <div className="segmented">
              {([9, 18] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={gameDay.holeCount === n ? 'seg active' : 'seg'}
                  onClick={() => setHoleCount(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </label>
        </div>

        <h4>Par by hole</h4>
        <div className="par-grid">
          {gameDay.pars.slice(0, gameDay.holeCount).map((par, i) => (
            <label key={i} className="par-cell">
              <span>{i + 1}</span>
              <select
                value={par}
                onChange={(e) => {
                  const pars = [...gameDay.pars]
                  pars[i] = Number(e.target.value)
                  update({ pars })
                }}
              >
                {[3, 4, 5, 6].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Who showed up ({attendees.length})</h3>
        {sortedPlayers.length === 0 && (
          <p className="empty-note">
            Roster's empty. Add players below or on the Roster tab.
          </p>
        )}
        <div className="chip-grid">
          {sortedPlayers.map((p) => {
            const checked = gameDay.attendeeIds.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                className={checked ? 'chip active' : 'chip'}
                onClick={() => toggleAttendee(p)}
              >
                <span className={`class-dot class-${p.playerClass}`} />
                {playerLabel(p)}
              </button>
            )
          })}
        </div>
        <button
          className="btn small"
          style={{ marginTop: '0.75rem' }}
          onClick={() => setShowQuickAdd((v) => !v)}
        >
          {showQuickAdd ? 'Hide quick add' : '+ New face showed up'}
        </button>
        {showQuickAdd && (
          <PlayerForm
            onSave={(p) => {
              dispatch({ type: 'addPlayer', player: p })
              update({ attendeeIds: [...gameDay.attendeeIds, p.id] })
            }}
          />
        )}
      </div>

      <div className="card">
        <h3>🎰 The Swing Game</h3>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={gameDay.swing.enabled}
            onChange={(e) =>
              update({ swing: { ...gameDay.swing, enabled: e.target.checked } })
            }
          />
          <span>Swing Game is ON</span>
        </label>

        {gameDay.swing.enabled && (
          <>
            <div className="field-row">
              <label>
                $ per hole
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={gameDay.swing.dollarsPerHole}
                  onChange={(e) =>
                    update({
                      swing: {
                        ...gameDay.swing,
                        dollarsPerHole: Number(e.target.value) || 0,
                      },
                    })
                  }
                />
              </label>
              <label>
                Downs (0 = off)
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={gameDay.swing.downsN}
                  onChange={(e) =>
                    update({
                      swing: {
                        ...gameDay.swing,
                        downsN: Math.max(0, Number(e.target.value) || 0),
                      },
                    })
                  }
                />
              </label>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={gameDay.swing.stacking}
                  onChange={(e) =>
                    update({
                      swing: { ...gameDay.swing, stacking: e.target.checked },
                    })
                  }
                />
                <span>
                  Stacking downs{' '}
                  <small>(every extra loss on the streak spawns another bet)</small>
                </span>
              </label>
            </div>

            <h4>In the pot ({entrants.length})</h4>
            <p className="hint">
              Tap everyone who threw a ball in. Then crown the two who got
              drawn — that's the Swing Team.
            </p>
            <div className="chip-grid">
              {attendees.map((p) => {
                const inPot = gameDay.swingEntrantIds.includes(p.id)
                const onTeam = gameDay.swingTeamIds.includes(p.id)
                return (
                  <span key={p.id} className="entrant-chip">
                    <button
                      type="button"
                      className={inPot ? 'chip active' : 'chip'}
                      onClick={() => toggleSwingEntrant(p.id)}
                    >
                      <span className={`class-dot class-${p.playerClass}`} />
                      {playerLabel(p)}
                    </button>
                    {inPot && (
                      <button
                        type="button"
                        title="On the Swing Team"
                        className={onTeam ? 'crown active' : 'crown'}
                        onClick={() => toggleSwingTeam(p.id)}
                      >
                        👑
                      </button>
                    )}
                  </span>
                )
              })}
            </div>
            {gameDay.swingTeamIds.length === 2 && (
              <p className="swing-team-banner">
                👑 Swing Team:{' '}
                <strong>
                  {gameDay.swingTeamIds
                    .map((id) => {
                      const p = state.players.find((pl) => pl.id === id)
                      return p ? playerLabel(p) : '?'
                    })
                    .join(' & ')}
                </strong>{' '}
                vs. literally everybody. Godspeed.
              </p>
            )}
          </>
        )}
      </div>

      <div className="card danger-zone">
        <button
          className="btn danger"
          onClick={() => {
            if (window.confirm('Delete this game day and all its scores?')) {
              dispatch({ type: 'removeGameDay', id: gameDay.id })
            }
          }}
        >
          Delete this game day
        </button>
        <button
          className="btn"
          onClick={() => dispatch({ type: 'selectGameDay', id: null })}
        >
          Switch game day
        </button>
      </div>
    </section>
  )
}
