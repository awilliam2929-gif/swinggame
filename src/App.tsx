import { useState } from 'react'
import GameDaySetup from './screens/GameDaySetup'
import History from './screens/History'
import Results from './screens/Results'
import Roster from './screens/Roster'
import ScoreEntry from './screens/ScoreEntry'
import Settlement from './screens/Settlement'
import { AppProvider, useCurrentGameDay } from './store/AppContext'

const TABS = [
  { id: 'gameday', label: 'Game Day' },
  { id: 'scores', label: 'Scores' },
  { id: 'results', label: 'Results' },
  { id: 'payup', label: 'Pay Up' },
  { id: 'history', label: 'History' },
  { id: 'roster', label: 'Roster' },
] as const

type TabId = (typeof TABS)[number]['id']

function Shell() {
  const [tab, setTab] = useState<TabId>('gameday')
  const gameDay = useCurrentGameDay()
  const isLanding = tab === 'gameday' && !gameDay

  return (
    <div className="app">
      <header className={`hero ${isLanding ? 'hero-landing' : 'hero-compact'}`}>
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-overlay" aria-hidden="true" />

        <div className="hero-inner">
          <div className="hero-bar">
            <div className="brand">
              <span className="brand-mark" aria-hidden="true">
                SG
              </span>
              <span className="brand-name">Swing Game</span>
            </div>

            <nav className="hero-nav" aria-label="Main">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={tab === t.id ? 'nav-link active' : 'nav-link'}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            {gameDay && (
              <span className="current-day">
                {gameDay.date}
                {gameDay.course ? ` · ${gameDay.course}` : ''} ·{' '}
                {gameDay.holeCount} holes
              </span>
            )}
          </div>

          {isLanding && (
            <div className="hero-copy">
              <p className="hero-script">Score. Bet. Settle.</p>
              <h1 className="hero-title">
                Turn every round into payday
              </h1>
              <p className="hero-lede">
                Track gross scores, run the Swing Game, and settle up with a
                sheet that ends the arguing before the 19th hole.
              </p>
            </div>
          )}
        </div>
      </header>

      <div className={`shell ${isLanding ? 'shell-landing' : ''}`}>
        <main className="content">
          {tab === 'gameday' && <GameDaySetup />}
          {tab === 'scores' && <ScoreEntry />}
          {tab === 'results' && <Results />}
          {tab === 'payup' && <Settlement />}
          {tab === 'history' && <History />}
          {tab === 'roster' && <Roster />}
        </main>
        <footer className="footer">
          Gross scores. Real money. Fake friends.
        </footer>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
