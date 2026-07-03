import type { GameDay, Player } from '../store/types'
import { playerLabel, sideBetsFor } from '../store/types'
import { money } from '../ui/money'

interface SideBetsSummaryProps {
  gameDay: GameDay
  players: Player[]
}

export default function SideBetsSummary({ gameDay, players }: SideBetsSummaryProps) {
  const sideBets = sideBetsFor(gameDay)
  const byId = new Map(players.map((p) => [p.id, p]))
  const name = (id: string) => {
    const p = byId.get(id)
    return p ? playerLabel(p) : '(deleted player)'
  }

  const roster = (ids: string[]) =>
    ids.length === 0
      ? 'No one selected yet'
      : ids.map(name).join(', ')

  const enabled = [
    sideBets.skins.enabled && {
      key: 'skins',
      title: 'Skins',
      detail: `${money(sideBets.skins.ante)} ante · ${sideBets.skins.entrantIds.length} players`,
      roster: roster(sideBets.skins.entrantIds),
    },
    sideBets.birdies.enabled && {
      key: 'birdies',
      title: 'Birdies / eagles / albatrosses',
      detail: `${money(sideBets.birdies.birdie)} birdie · ${money(sideBets.birdies.eagle)} eagle · ${money(sideBets.birdies.albatross)} albatross`,
      roster: roster(sideBets.birdies.entrantIds),
    },
    sideBets.greenies.enabled && {
      key: 'greenies',
      title: 'Greenies (CTP)',
      detail: `${money(sideBets.greenies.amount)} per win`,
      roster: roster(sideBets.greenies.entrantIds),
    },
  ].filter(Boolean) as Array<{
    key: string
    title: string
    detail: string
    roster: string
  }>

  return (
    <div className="card">
      <h3>Side bets</h3>
      {enabled.length === 0 ? (
        <p className="empty-note">
          Nothing toggled on for this day. Turn side bets on under Game Day
          setup.
        </p>
      ) : (
        <ul className="side-bet-summary-list">
          {enabled.map((bet) => (
            <li key={bet.key} className="side-bet-summary-item">
              <div className="side-bet-summary-head">
                <strong>{bet.title}</strong>
                <span className="side-bet-summary-detail">{bet.detail}</span>
              </div>
              <p className="hint side-bet-summary-roster">{bet.roster}</p>
              <p className="hint side-bet-pending">
                Payout calculation coming soon — config is saved for this day.
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
