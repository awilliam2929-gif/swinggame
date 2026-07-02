import { useMemo } from 'react'
import { netPayments } from '../engine/settle'
import { useApp, useCurrentGameDay } from '../store/AppContext'
import { playerLabel } from '../store/types'
import { computeSwing } from '../ui/compute'
import { seedFrom, settleLine } from '../ui/flavor'
import { money } from '../ui/money'

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
          <p className="subtitle">The final damage, netted down.</p>
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
  const payments = netPayments(computation.result.playerNet)

  return (
    <section>
      <header className="screen-header">
        <h2>💸 Pay Up</h2>
        <p className="subtitle">{settleLine(seedFrom(gameDay.id))}</p>
      </header>

      <div className="card">
        {payments.length === 0 ? (
          <p className="empty-note">
            Dead even across the board. Boring. Play for more next time.
          </p>
        ) : (
          <ul className="payments">
            {payments.map((p, i) => (
              <li key={i} className="payment">
                <span className="payer">{name(p.from)}</span>
                <span className="arrow">pays</span>
                <span className="amount">{money(p.amount)}</span>
                <span className="arrow">to</span>
                <span className="payee">{name(p.to)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="hint">
          Netted to the fewest possible hand-offs. Swing Game only for now —
          skins, greenies, and birdie money join this sheet in the next
          version.
        </p>
      </div>
    </section>
  )
}
