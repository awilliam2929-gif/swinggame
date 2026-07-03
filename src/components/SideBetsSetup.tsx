import type { PlayerId } from '../engine/types'
import type { GameDay, Player, SideBetsSettings } from '../store/types'
import { playerLabel, sideBetsFor } from '../store/types'

interface SideBetsSetupProps {
  gameDay: GameDay
  attendees: Player[]
  onChange: (sideBets: SideBetsSettings) => void
}

function toggleEntrant(ids: PlayerId[], pid: PlayerId): PlayerId[] {
  return ids.includes(pid) ? ids.filter((id) => id !== pid) : [...ids, pid]
}

function EntrantChips({
  attendees,
  entrantIds,
  onToggle,
}: {
  attendees: Player[]
  entrantIds: PlayerId[]
  onToggle: (pid: PlayerId) => void
}) {
  if (attendees.length === 0) {
    return <p className="empty-note">Mark attendees first.</p>
  }

  return (
    <div className="chip-grid">
      {attendees.map((p) => (
        <button
          key={p.id}
          type="button"
          className={entrantIds.includes(p.id) ? 'chip active' : 'chip'}
          onClick={() => onToggle(p.id)}
        >
          <span className={`class-dot class-${p.playerClass}`} />
          {playerLabel(p)}
        </button>
      ))}
    </div>
  )
}

export default function SideBetsSetup({
  gameDay,
  attendees,
  onChange,
}: SideBetsSetupProps) {
  const sideBets = sideBetsFor(gameDay)

  function patch(partial: Partial<SideBetsSettings>) {
    onChange({ ...sideBets, ...partial })
  }

  function patchSkins(partial: Partial<SideBetsSettings['skins']>) {
    patch({ skins: { ...sideBets.skins, ...partial } })
  }

  function patchBirdies(partial: Partial<SideBetsSettings['birdies']>) {
    patch({ birdies: { ...sideBets.birdies, ...partial } })
  }

  function patchGreenies(partial: Partial<SideBetsSettings['greenies']>) {
    patch({ greenies: { ...sideBets.greenies, ...partial } })
  }

  const anyEnabled =
    sideBets.skins.enabled ||
    sideBets.birdies.enabled ||
    sideBets.greenies.enabled

  return (
    <div className="card">
      <h3>Side bets</h3>
      <p className="hint">
        Toggle the day&apos;s side games and who&apos;s in each pot. Payout
        math lands on Results and Pay Up in the next update — setup saves here
        now.
      </p>

      <div className="side-bet-block">
        <label className="toggle-row side-bet-toggle">
          <input
            type="checkbox"
            checked={sideBets.skins.enabled}
            onChange={(e) => patchSkins({ enabled: e.target.checked })}
          />
          <span>Skins (pot)</span>
        </label>
        {sideBets.skins.enabled && (
          <>
            <div className="field-row">
              <label>
                Ante per player
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={sideBets.skins.ante}
                  onChange={(e) =>
                    patchSkins({ ante: Number(e.target.value) || 0 })
                  }
                />
              </label>
            </div>
            <h4>In the skins game</h4>
            <EntrantChips
              attendees={attendees}
              entrantIds={sideBets.skins.entrantIds}
              onToggle={(pid) =>
                patchSkins({
                  entrantIds: toggleEntrant(sideBets.skins.entrantIds, pid),
                })
              }
            />
          </>
        )}
      </div>

      <div className="side-bet-block">
        <label className="toggle-row side-bet-toggle">
          <input
            type="checkbox"
            checked={sideBets.birdies.enabled}
            onChange={(e) => patchBirdies({ enabled: e.target.checked })}
          />
          <span>Birdies / eagles / albatrosses</span>
        </label>
        {sideBets.birdies.enabled && (
          <>
            <div className="field-row">
              <label>
                Birdie
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={sideBets.birdies.birdie}
                  onChange={(e) =>
                    patchBirdies({ birdie: Number(e.target.value) || 0 })
                  }
                />
              </label>
              <label>
                Eagle
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={sideBets.birdies.eagle}
                  onChange={(e) =>
                    patchBirdies({ eagle: Number(e.target.value) || 0 })
                  }
                />
              </label>
              <label>
                Albatross
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={sideBets.birdies.albatross}
                  onChange={(e) =>
                    patchBirdies({ albatross: Number(e.target.value) || 0 })
                  }
                />
              </label>
            </div>
            <h4>In this bet</h4>
            <EntrantChips
              attendees={attendees}
              entrantIds={sideBets.birdies.entrantIds}
              onToggle={(pid) =>
                patchBirdies({
                  entrantIds: toggleEntrant(sideBets.birdies.entrantIds, pid),
                })
              }
            />
          </>
        )}
      </div>

      <div className="side-bet-block">
        <label className="toggle-row side-bet-toggle">
          <input
            type="checkbox"
            checked={sideBets.greenies.enabled}
            onChange={(e) => patchGreenies({ enabled: e.target.checked })}
          />
          <span>Closest to the pin (greenies)</span>
        </label>
        {sideBets.greenies.enabled && (
          <>
            <div className="field-row">
              <label>
                $ per winner
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={sideBets.greenies.amount}
                  onChange={(e) =>
                    patchGreenies({ amount: Number(e.target.value) || 0 })
                  }
                />
              </label>
            </div>
            <h4>In this bet</h4>
            <EntrantChips
              attendees={attendees}
              entrantIds={sideBets.greenies.entrantIds}
              onToggle={(pid) =>
                patchGreenies({
                  entrantIds: toggleEntrant(sideBets.greenies.entrantIds, pid),
                })
              }
            />
            <p className="hint">
              Par-3 winners get entered on the Scores tab once that&apos;s wired
              up.
            </p>
          </>
        )}
      </div>

      {!anyEnabled && (
        <p className="empty-note side-bet-empty">
          No side bets toggled on. The Swing Game can carry the day solo.
        </p>
      )}
    </div>
  )
}
