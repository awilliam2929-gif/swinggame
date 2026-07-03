import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  fetchRemoteState,
  mergeStates,
  SyncEngine,
  type SyncStatus,
} from '../sync/sync'
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
  | { type: 'hydrate'; state: AppState }

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
    case 'hydrate':
      return action.state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: (action: Action) => void
  /** Null when Supabase isn't configured or nobody is signed in. */
  session: Session | null
  /** False until the stored session (if any) has been checked. */
  authReady: boolean
  syncStatus: SyncStatus
  signOut: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(!supabase)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const engineRef = useRef<SyncEngine | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  // Always keep the local cache — it's the offline copy and the whole
  // store in local-only mode.
  useEffect(() => {
    saveState(state)
  }, [state])

  // Track the Supabase session.
  useEffect(() => {
    if (!supabase) return
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // On sign-in: pull the group's data, merge (server wins per entity,
  // local-only survives), then start write-through sync. Local-only
  // entities get pushed up by the first push() after prime().
  useEffect(() => {
    if (!supabase || !session) {
      engineRef.current?.stop()
      engineRef.current = null
      if (supabase) setSyncStatus('idle')
      return
    }
    let cancelled = false
    setSyncStatus('syncing')
    void fetchRemoteState()
      .then((remote) => {
        if (cancelled) return
        const merged = mergeStates(stateRef.current, remote)
        const engine = new SyncEngine(setSyncStatus)
        // Baseline is the REMOTE view; pushing the merged state right
        // after uploads anything the server didn't have yet.
        engine.prime({ ...merged, ...remote })
        engineRef.current = engine
        dispatch({ type: 'hydrate', state: merged })
        engine.push(merged)
        setSyncStatus('synced')
      })
      .catch((err) => {
        console.error('Failed to load group data:', err)
        if (!cancelled) setSyncStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [session])

  // Push every state change through the engine (no-op until primed).
  useEffect(() => {
    engineRef.current?.push(state)
  }, [state])

  const signOut = useCallback(() => {
    engineRef.current?.stop()
    engineRef.current = null
    void supabase?.auth.signOut()
  }, [])

  return (
    <AppContext.Provider
      value={{ state, dispatch, session, authReady, syncStatus, signOut }}
    >
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
