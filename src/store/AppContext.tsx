import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react'
import { loadState, saveState } from './storage'
import type { AppState, GameDay, Player } from './types'

type Action =
  | { type: 'addPlayer'; player: Player }
  | { type: 'updatePlayer'; player: Player }
  | { type: 'removePlayer'; id: string }
  | { type: 'createGameDay'; gameDay: GameDay }
  | { type: 'updateGameDay'; gameDay: GameDay }
  | { type: 'selectGameDay'; id: string | null }
  | { type: 'removeGameDay'; id: string }

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
