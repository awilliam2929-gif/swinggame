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

  const anyEnabled = sideBets.skins.enabled || sideBets.birdies.enabled

  return (
    <div className="card">
      <h3>Side bets</h3>
      <p className="hint">
        Toggle the day&apos;s side games and who&apos;s in each pot. Payouts
        show up live on Results and Pay Up.
      </p>

      <div className="side-bet-block">
        <label className="toggle-row side-bet-toggle">
          <input
            type="checkbox"
            checked={sideBets.skins.enabled}
            onChange={(e) => patchSkins({ enabled: e.target.checked })}
          />
          <span>Skins &amp; greenies (pot)</span>
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
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={sideBets.skins.greenies}
                  onChange={(e) => patchSkins({ greenies: e.target.checked })}
                />
                <span>
                  Greenies included{' '}
                  <small>
                    (CTP on par 3s — each greenie is one share of the pot,
                    same as a skin)
                  </small>
                </span>
              </label>
            </div>
            <h4>In the pot</h4>
            <EntrantChips
              attendees={attendees}
              entrantIds={sideBets.skins.entrantIds}
              onToggle={(pid) =>
                patchSkins({
                  entrantIds: toggleEntrant(sideBets.skins.entrantIds, pid),
                })
              }
            />
            {sideBets.skins.greenies && (
              <p className="hint">
                Enter each par-3&apos;s closest-to-the-pin winner on the Scores
                tab.
              </p>
            )}
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

      {!anyEnabled && (
        <p className="empty-note side-bet-empty">
          No side bets toggled on. The Swing Game can carry the day solo.
        </p>
      )}
    </div>
  )
}
