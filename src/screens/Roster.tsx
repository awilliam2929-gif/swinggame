import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { playerLabel, type Player, type PlayerClass } from '../store/types'

const CLASS_HINTS: Record<PlayerClass, string> = {
  A: 'A — actually good',
  B: 'B — dangerous with a stroke of luck',
  C: 'C — here for the beer',
}

interface PlayerFormProps {
  initial?: Player
  onSave: (p: Player) => void
  onCancel?: () => void
}

export function PlayerForm({ initial, onSave, onCancel }: PlayerFormProps) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [lastName, setLastName] = useState(initial?.lastName ?? '')
  const [nickname, setNickname] = useState(initial?.nickname ?? '')
  const [playerClass, setPlayerClass] = useState<PlayerClass>(
    initial?.playerClass ?? 'B',
  )

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() && !nickname.trim()) return
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nickname: nickname.trim(),
      playerClass,
    })
    if (!initial) {
      setFirstName('')
      setLastName('')
      setNickname('')
      setPlayerClass('B')
    }
  }

  return (
    <form className="player-form" onSubmit={submit}>
      <input
        placeholder="First name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      <input
        placeholder="Last name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <input
        placeholder='Nickname (what we yell at them)'
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <select
        value={playerClass}
        onChange={(e) => setPlayerClass(e.target.value as PlayerClass)}
      >
        {(['A', 'B', 'C'] as const).map((c) => (
          <option key={c} value={c}>
            {CLASS_HINTS[c]}
          </option>
        ))}
      </select>
      <div className="form-actions">
        <button type="submit" className="btn primary">
          {initial ? 'Save' : 'Add player'}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default function Roster() {
  const { state, dispatch } = useApp()
  const [editingId, setEditingId] = useState<string | null>(null)

  const players = [...state.players].sort((a, b) =>
    playerLabel(a).localeCompare(playerLabel(b)),
  )

  return (
    <section>
      <header className="screen-header">
        <h2>🧑‍🤝‍🧑 The Degenerates</h2>
        <p className="subtitle">
          The permanent roster. Add the regulars once — check them in on game
          day.
        </p>
      </header>

      <div className="card">
        <h3>New victim</h3>
        <PlayerForm onSave={(p) => dispatch({ type: 'addPlayer', player: p })} />
      </div>

      {players.length === 0 ? (
        <p className="empty-note">
          Nobody on the roster yet. Every empire starts with one sucker.
        </p>
      ) : (
        <table className="roster-table">
          <thead>
            <tr>
              <th>Nickname</th>
              <th>Name</th>
              <th>Class</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) =>
              editingId === p.id ? (
                <tr key={p.id}>
                  <td colSpan={4}>
                    <PlayerForm
                      initial={p}
                      onSave={(updated) => {
                        dispatch({ type: 'updatePlayer', player: updated })
                        setEditingId(null)
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={p.id}>
                  <td className="nickname">{playerLabel(p)}</td>
                  <td>
                    {p.firstName} {p.lastName}
                  </td>
                  <td>
                    <span className={`class-badge class-${p.playerClass}`}>
                      {p.playerClass}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button className="btn small" onClick={() => setEditingId(p.id)}>
                      Edit
                    </button>
                    <button
                      className="btn small danger"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove ${playerLabel(p)} from the roster? Past game days keep their scores.`,
                          )
                        ) {
                          dispatch({ type: 'removePlayer', id: p.id })
                        }
                      }}
                    >
                      Cut
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      )}
    </section>
  )
}
