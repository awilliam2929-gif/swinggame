import { useMemo } from 'react'
import type { MatchResult } from '../engine/types'
import { useApp, useCurrentGameDay } from '../store/AppContext'
import { playerLabel } from '../store/types'
import { computeSwing } from '../ui/compute'
import { loserLine, seedFrom, winnerLine } from '../ui/flavor'
import { signedMoney } from '../ui/money'

function OutcomeStrip({ match }: { match: MatchResult }) {
  return (
    <div className="outcome-strip">
      {match.outcomes.map((o, i) => (
        <span
          key={i}
          className={`outcome outcome-${o.toLowerCase()}`}
          title={`Hole ${i + 1}`}
        >
          {o === 'SWING' ? 'W' : o === 'OPP' ? 'L' : '–'}
        </span>
      ))}
    </div>
  )
}

export default function Results() {
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
          <h2>🏆 Results</h2>
          <p className="subtitle">Start a game day first (Game Day tab).</p>
        </header>
      </section>
    )
  }

  if (!computation.ok) {
    return (
      <section>
        <header className="screen-header">
          <h2>🏆 Results</h2>
          <p className="subtitle">The Swing Game, fully computed.</p>
        </header>
        <p className="empty-note">⏳ {computation.reason}</p>
      </section>
    )
  }

  const { result } = computation
  const byId = new Map(state.players.map((p) => [p.id, p]))
  const name = (id: string) => {
    const p = byId.get(id)
    return p ? playerLabel(p) : '(deleted player)'
  }

  const board = Object.entries(result.playerNet)
    .map(([id, net]) => ({ id, net }))
    .sort((a, b) => b.net - a.net)
  const seed = seedFrom(gameDay.id)
  const top = board[0]
  const bottom = board[board.length - 1]

  return (
    <section>
      <header className="screen-header">
        <h2>🏆 Results</h2>
        <p className="subtitle">
          Swing Team <strong>{result.swingTeam.map(name).join(' & ')}</strong>{' '}
          vs. {result.matches.length}{' '}
          {result.matches.length === 1 ? 'team' : 'teams'}. Every bet, every
          down, every dollar.
        </p>
      </header>

      <div className="card">
        <h3>💰 The Leaderboard</h3>
        <table className="board-table">
          <tbody>
            {board.map(({ id, net }, i) => (
              <tr key={id}>
                <td className="rank">
                  {i === 0 && net > 0
                    ? '🤑'
                    : i === board.length - 1 && net < 0
                      ? '🩸'
                      : i + 1}
                </td>
                <td className="nickname">
                  {name(id)}
                  {result.swingTeam.includes(id) && ' 👑'}
                </td>
                <td
                  className={`net ${net > 0.005 ? 'pos' : net < -0.005 ? 'neg' : ''}`}
                >
                  {signedMoney(net)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {top && top.net > 0.005 && (
          <p className="flavor pos">
            🤑 {name(top.id)}: {winnerLine(seed)}
          </p>
        )}
        {bottom && bottom.net < -0.005 && (
          <p className="flavor neg">
            🩸 {name(bottom.id)}: {loserLine(seed)}
          </p>
        )}
      </div>

      <div className="card">
        <h3>🔍 Match by match</h3>
        <p className="hint">
          W/L/– is from the Swing Team's point of view. Open a match to see
          every bet the downs spawned.
        </p>
        {result.matches.map((match) => (
          <details key={match.opponents.join('+')} className="match">
            <summary>
              <span className="match-title">
                vs. {match.opponents.map(name).join(' & ')}
              </span>
              <span
                className={`net ${
                  match.totalSwing > 0.005
                    ? 'pos'
                    : match.totalSwing < -0.005
                      ? 'neg'
                      : ''
                }`}
              >
                {signedMoney(match.totalSwing)}
              </span>
            </summary>
            <OutcomeStrip match={match} />
            <table className="bets-table">
              <thead>
                <tr>
                  <th>Bet</th>
                  <th>Starts</th>
                  <th>Swing W–L</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {match.bets.map((bet, i) => (
                  <tr key={i}>
                    <td>
                      {bet.trigger === 'ORIGINAL'
                        ? 'Original'
                        : bet.trigger === 'SWING'
                          ? '👑 went down'
                          : 'They went down'}
                    </td>
                    <td>hole {bet.startHole}</td>
                    <td>
                      {bet.holesWonSwing}–{bet.holesWonOpp}
                    </td>
                    <td
                      className={`net ${
                        bet.valueSwing > 0.005
                          ? 'pos'
                          : bet.valueSwing < -0.005
                            ? 'neg'
                            : ''
                      }`}
                    >
                      {signedMoney(bet.valueSwing)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}
      </div>
    </section>
  )
}
