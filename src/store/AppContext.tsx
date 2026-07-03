import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react'
import { loadState, saveState } from './storage'
import type { AppState, GameDay, Player, SavedCourse } from './types'

type Action =
  | { type: 'addPlayer'; player: Player }
  | { type: 'updatePlayer'; player: Player }
  | { type: 'removePlayer'; id: string }
  | { type: 'createGameDay'; gameDay: GameDay }
  | { type: 'updateGameDay'; gameDay: GameDay }
  | { type: 'selectGameDay'; id: string | null }
  | { type: 'removeGameDay'; id: string }
  | { type: 'rememberCourse'; course: SavedCourse }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'addPlayer':
      return { ...state, players: [...state.players, action.player] }
    case 'updatePlayer':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.player.id ? action.player : p,
        ),
      }
    case 'removePlayer':
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.id),
      }
    case 'createGameDay':
      return {
        ...state,
        gameDays: [action.gameDay, ...state.gameDays],
        currentGameDayId: action.gameDay.id,
      }
    case 'updateGameDay':
      return {
        ...state,
        gameDays: state.gameDays.map((g) =>
          g.id === action.gameDay.id ? action.gameDay : g,
        ),
      }
    case 'selectGameDay':
      return { ...state, currentGameDayId: action.id }
    case 'removeGameDay': {
      const gameDays = state.gameDays.filter((g) => g.id !== action.id)
      return {
        ...state,
        gameDays,
        currentGameDayId:
          state.currentGameDayId === action.id
            ? (gameDays[0]?.id ?? null)
            : state.currentGameDayId,
      }
    }
    case 'rememberCourse': {
      const now = new Date().toISOString()
      const existing = state.courses.find((c) => c.id === action.course.id)
      const next: SavedCourse = {
        ...existing,
        ...action.course,
        pars: action.course.pars ?? existing?.pars,
        holeCount: action.course.holeCount ?? existing?.holeCount,
        lastUsed: now,
      }
      const without = state.courses.filter((c) => c.id !== next.id)
      return {
        ...state,
        courses: [next, ...without].slice(0, 40),
      }
    }
  }
}

interface AppContextValue {
  state: AppState
  dispatch: (action: Action) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  useEffect(() => {
    saveState(state)
  }, [state])
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

export function useCurrentGameDay(): GameDay | null {
  const { state } = useApp()
  return (
    state.gameDays.find((g) => g.id === state.currentGameDayId) ?? null
  )
}
