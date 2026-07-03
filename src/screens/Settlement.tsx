import { useMemo } from 'react'
import { useApp, useCurrentGameDay } from '../store/AppContext'
import { playerLabel } from '../store/types'
import { computeSwing } from '../ui/compute'
import { seedFrom, settleLine } from '../ui/flavor'
import { money } from '../ui/money'
import { teamPaymentsFromMatches } from '../ui/teamPayments'
import SideBetsSummary from '../components/SideBetsSummary'

export default function Settlement() {
  const { state } = useApp()
  const gameDay = useCurrentGameDay()

  const computation = useMemo(
    () => (gameDay ? computeSwing(gameDay, state.players) : null),
    [gameDay, state.players],
  )

  if (!gameDay || !computation) {
    return (
      <section>
        <header className="screen-header">
          <h2>💸 Pay Up</h2>
          <p className="subtitle">Start a game day first (Game Day tab).</p>
        </header>
      </section>
    )
  }

  if (!computation.ok) {
    return (
      <section>
        <header className="screen-header">
          <h2>💸 Pay Up</h2>
          <p className="subtitle">The final damage, team by team.</p>
        </header>
        <p className="empty-note">⏳ {computation.reason}</p>
      </section>
    )
  }

  const byId = new Map(state.players.map((p) => [p.id, p]))
  const name = (id: string) => {
    const p = byId.get(id)
    return p ? playerLabel(p) : '(deleted player)'
  }
  const payments = teamPaymentsFromMatches(computation.result, name)

  return (
    <section>
      <header className="screen-header">
        <h2>💸 Pay Up</h2>
        <p className="subtitle">{settleLine(seedFrom(gameDay.id))}</p>
      </header>

      <div className="card">
        {payments.length === 0 ? (
          <p className="empty-note">
            Dead even on every match. Boring. Play for more next time.
          </p>
        ) : (
          <ul className="payments">
            {payments.map((payment) => (
              <li key={payment.id} className="payment team-payment">
                <span className="payer">{payment.fromLabel}</span>
                <span className="arrow">pays</span>
                <span className="amount">{money(payment.amount)}</span>
                <span className="arrow">to</span>
                <span className="payee">{payment.toLabel}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="hint">
          One line per opposing team vs. the Swing Team — both names on each
          side. Matches that finished even are omitted. Skins, greenies, and
          birdie money join this sheet in a later version.
        </p>
      </div>

      <SideBetsSummary gameDay={gameDay} players={state.players} />
    </section>
  )
}
