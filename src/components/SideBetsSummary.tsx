import { useMemo } from 'react'
import type { GameDay, Player } from '../store/types'
import { playerLabel, sideBetsFor } from '../store/types'
import { computeSideBets } from '../ui/compute'
import { money, signedMoney } from '../ui/money'

interface SideBetsSummaryProps {
  gameDay: GameDay
  players: Player[]
}

function netClass(v: number): string {
  return v > 0.005 ? 'pos' : v < -0.005 ? 'neg' : ''
}

export default function SideBetsSummary({ gameDay, players }: SideBetsSummaryProps) {
  const sideBets = sideBetsFor(gameDay)
  const computed = useMemo(() => computeSideBets(gameDay), [gameDay])

  const byId = new Map(players.map((p) => [p.id, p]))
  const name = (id: string) => {
    const p = byId.get(id)
    return p ? playerLabel(p) : '(deleted player)'
  }

  const { skins, birdies } = computed
  const nothingOn = !sideBets.skins.enabled && !sideBets.birdies.enabled

  if (nothingOn) {
    return (
      <div className="card">
        <h3>Side bets</h3>
        <p className="empty-note">
          Nothing toggled on for this day. Turn side bets on under Game Day
          setup.
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h3>Side bets</h3>

      {sideBets.skins.enabled && (
        <div className="side-bet-summary-item">
          <div className="side-bet-summary-head">
            <strong>
              Skins{sideBets.skins.greenies ? ' & greenies' : ''} pot
            </strong>
            <span className="side-bet-summary-detail">
              {money(sideBets.skins.ante)} ante ×{' '}
              {sideBets.skins.entrantIds.length} players ={' '}
              {money(sideBets.skins.ante * sideBets.skins.entrantIds.length)}{' '}
              pot
            </span>
          </div>
          {!skins ? (
            <p className="hint">Pick at least 2 players for the pot.</p>
          ) : (
            <>
              {skins.shares.length > 0 ? (
                <>
                  <p className="hint">
                    {skins.shares.length}{' '}
                    {skins.shares.length === 1 ? 'share' : 'shares'} won —{' '}
                    each worth <strong>{money(skins.shareValue)}</strong>
                  </p>
                  <ul className="share-list">
                    {skins.shares.map((share, i) => (
                      <li key={i}>
                        <span className="share-kind">
                          {share.kind === 'skin' ? '💰 skin' : '🎯 greenie'}
                        </span>{' '}
                        hole {share.hole} — <strong>{name(share.playerId)}</strong>
                        {share.score != null && ` (${share.score})`}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="hint">
                  {skins.refunded && skins.pendingHoles.length === 0
                    ? 'Nothing won — everyone ties, everyone gets the ante back.'
                    : 'No shares won yet.'}
                </p>
              )}
              {skins.pendingHoles.length > 0 && (
                <p className="hint">
                  ⏳ Holes {skins.pendingHoles.join(', ')} still missing
                  scores from pot players.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {sideBets.birdies.enabled && (
        <div className="side-bet-summary-item">
          <div className="side-bet-summary-head">
            <strong>Birdies / eagles / albatrosses</strong>
            <span className="side-bet-summary-detail">
              {money(sideBets.birdies.birdie)} / {money(sideBets.birdies.eagle)}{' '}
              / {money(sideBets.birdies.albatross)} — paid by every other
              player in the bet
            </span>
          </div>
          {!birdies ? (
            <p className="hint">Pick at least 2 players for this bet.</p>
          ) : birdies.events.length === 0 ? (
            <p className="hint">No birdies yet. Shocking.</p>
          ) : (
            <ul className="share-list">
              {birdies.events.map((event, i) => (
                <li key={i}>
                  <span className="share-kind">
                    {event.tier === 'birdie'
                      ? '🐦 birdie'
                      : event.tier === 'eagle'
                        ? '🦅 eagle'
                        : '🌟 albatross'}
                  </span>{' '}
                  hole {event.hole} — <strong>{name(event.playerId)}</strong>{' '}
                  collects {money(event.amountEach)} each
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {Object.keys(computed.playerNet).length > 0 && (
        <div className="side-bet-summary-item">
          <div className="side-bet-summary-head">
            <strong>Side bet net</strong>
          </div>
          <ul className="share-list">
            {Object.entries(computed.playerNet)
              .sort(([, a], [, b]) => b - a)
              .map(([pid, net]) => (
                <li key={pid}>
                  {name(pid)}:{' '}
                  <span className={`net ${netClass(net)}`}>
                    {signedMoney(net)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}
