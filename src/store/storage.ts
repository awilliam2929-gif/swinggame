import type { AppState } from './types'

const KEY = 'swinggame-v1'

const EMPTY: AppState = {
  players: [],
  gameDays: [],
  currentGameDayId: null,
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as AppState
    return {
      players: parsed.players ?? [],
      gameDays: parsed.gameDays ?? [],
      currentGameDayId: parsed.currentGameDayId ?? null,
    }
  } catch {
    return EMPTY
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable — nothing sensible to do client-side.
  }
}
