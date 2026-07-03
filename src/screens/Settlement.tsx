import { useMemo } from 'react'
import { netPayments } from '../engine/settle'
import { useApp, useCurrentGameDay } from '../store/AppContext'
import { playerLabel } from '../store/types'
import { computeSideBets, computeSwing } from '../ui/compute'
import { seedFrom, settleLine } from '../ui/flavor'
import { money, signedMoney } from '../ui/money'
import { teamPaymentsFromMatches } from '../ui/teamPayments'
import SideBetsSummary from '../components/SideBetsSummary'

export default function Settlement() {
  const { state } = useApp()
  const gameDay = useCurrentGameDay()

  const computation = useMemo(
    () => (gameDay ? computeSwing(gameDay, state.players) : null),
    [gameDay, state.players],
  )
  const sideBets = useMemo(
    () => (gameDay ? computeSideBets(gameDay) : null),
    [gameDay],
  )

  if (!gameDay || !computation || !sideBets) {
    return (
      <section>
        <header className="screen-header">
          <h2>Pay Up</h2>
          <p className="subtitle">Start a game day first (Game Day tab).</p>
        </header>
      </section>
    )
  }

  const byId = new Map(state.players.map((p) => [p.id, p]))
  const name = (id: string) => {
    const p = byId.get(id)
    return p ? playerLabel(p) : '(deleted player)'
  }

  if (!computation.ok) {
    return (
      <section className="settlement">
        <header className="screen-header">
          <h2>Pay Up</h2>
          <p className="subtitle">The final damage, team by team.</p>
        </header>
        <p className="empty-note">⏳ {computation.reason}</p>
        <SideBetsSummary gameDay={gameDay} players={state.players} />
      </section>
    )
  }

  const payments = teamPaymentsFromMatches(computation.result, name)

  const totalNet: Record<string, number> = { ...computation.result.playerNet }
  for (const [pid, v] of Object.entries(sideBets.playerNet)) {
    totalNet[pid] = (totalNet[pid] ?? 0) + v
  }
  const totals = Object.entries(totalNet)
    .map(([id, net]) => ({ id, net }))
    .sort((a, b) => b.net - a.net)
  const bottomLine = netPayments(totalNet)
  const hasSideBets = Object.keys(sideBets.playerNet).length > 0
  const topWinner = totals[0]?.net > 0.005 ? totals[0] : null
  const topLoser = totals[totals.length - 1]?.net < -0.005 ? totals[totals.length - 1] : null

  return (
    <section className="settlement">
      <header className="screen-header">
        <h2>Pay Up</h2>
        <p className="subtitle">{settleLine(seedFrom(gameDay.id))}</p>
      </header>

      <div className="desktop-split desktop-split-settlement">
        <div className="desktop-split-main">
          <div className="card">
            <h3>Swing Game — team by team</h3>
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
              side. Matches that finished even are omitted.
            </p>
          </div>

          <SideBetsSummary gameDay={gameDay} players={state.players} />
        </div>

        <div className="desktop-split-aside desktop-sticky-aside">
          <div className="card settlement-summary">
            <h3>The bottom line</h3>
            <p className="hint">
              Swing Game{hasSideBets ? ' + side bets' : ''}, one number per player,
              settled in the fewest hand-offs.
            </p>

            {(topWinner || topLoser) && (
              <div className="settlement-highlights">
                {topWinner && (
                  <div className="settlement-highlight pos">
                    <span className="settlement-highlight-label">Top winner</span>
                    <span className="settlement-highlight-name">{name(topWinner.id)}</span>
                    <span className="settlement-highlight-amount">
                      {signedMoney(topWinner.net)}
                    </span>
                  </div>
                )}
                {topLoser && (
                  <div className="settlement-highlight neg">
                    <span className="settlement-highlight-label">Biggest loser</span>
                    <span className="settlement-highlight-name">{name(topLoser.id)}</span>
                    <span className="settlement-highlight-amount">
                      {signedMoney(topLoser.net)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <table className="board-table settlement-totals">
              <tbody>
                {totals.map(({ id, net }) => (
                  <tr key={id}>
                    <td className="nickname">{name(id)}</td>
                    <td
                      className={`net ${net > 0.005 ? 'pos' : net < -0.005 ? 'neg' : ''}`}
                    >
                      {signedMoney(net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {bottomLine.length === 0 ? (
              <p className="empty-note">
                Everyone&apos;s square. A statistical miracle.
              </p>
            ) : (
              <>
                <h4 className="section-label">
                  {bottomLine.length} payment{bottomLine.length === 1 ? '' : 's'} to settle
                </h4>
                <ul className="payments payments-compact">
                  {bottomLine.map((p, i) => (
                    <li key={i} className="payment">
                      <span className="payer">{name(p.from)}</span>
                      <span className="arrow">pays</span>
                      <span className="amount">{money(p.amount)}</span>
                      <span className="arrow">to</span>
                      <span className="payee">{name(p.to)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
