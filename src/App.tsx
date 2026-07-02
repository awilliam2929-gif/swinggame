import { useState } from 'react'
import GameDaySetup from './screens/GameDaySetup'
import History from './screens/History'
import Results from './screens/Results'
import Roster from './screens/Roster'
import ScoreEntry from './screens/ScoreEntry'
import Settlement from './screens/Settlement'
import { AppProvider, useCurrentGameDay } from './store/AppContext'

const TABS = [
  { id: 'gameday', label: '📅 Game Day' },
  { id: 'scores', label: '✏️ Scores' },
  { id: 'results', label: '🏆 Results' },
  { id: 'payup', label: '💸 Pay Up' },
  { id: 'history', label: '📈 History' },
  { id: 'roster', label: '🧑‍🤝‍🧑 Roster' },
] as const

type TabId = (typeof TABS)[number]['id']

function Shell() {
  const [tab, setTab] = useState<TabId>('gameday')
  const gameDay = useCurrentGameDay()

  return (
    <div className="shell">
      <header className="masthead">
        <h1>
          ⛳ SWING GAME
          <span className="tagline">friendships tested weekly</span>
        </h1>
        {gameDay && (
          <span className="current-day">
            {gameDay.date}
            {gameDay.course ? ` · ${gameDay.course}` : ''} ·{' '}
            {gameDay.holeCount} holes
          </span>
        )}
      </header>
      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <main className="content">
        {tab === 'gameday' && <GameDaySetup />}
        {tab === 'scores' && <ScoreEntry />}
        {tab === 'results' && <Results />}
        {tab === 'payup' && <Settlement />}
        {tab === 'history' && <History />}
        {tab === 'roster' && <Roster />}
      </main>
      <footer className="footer">
        Gross scores. Real money. Fake friends. 🏌️
      </footer>
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
