import { describe, expect, it } from 'vitest'
import type { AppState } from '../store/types'
import { newGameDay } from '../store/types'
import { mergeStates } from './sync'

function player(id: string) {
  return {
    id,
    firstName: id,
    lastName: '',
    nickname: id,
    playerClass: 'B' as const,
  }
}

function state(overrides: Partial<AppState> = {}): AppState {
  return {
    players: [],
    gameDays: [],
    courses: [],
    currentGameDayId: null,
    ...overrides,
  }
}

describe('mergeStates', () => {
  it('server wins for entities both sides know', () => {
    const shared = player('a')
    const serverCopy = { ...shared, nickname: 'ServerNick' }
    const merged = mergeStates(
      state({ players: [shared] }),
      { players: [serverCopy], gameDays: [], courses: [] },
    )
    expect(merged.players).toEqual([serverCopy])
  })

  it('local-only entities survive the merge', () => {
    const localOnly = player('local')
    const remote = player('remote')
    const merged = mergeStates(
      state({ players: [localOnly] }),
      { players: [remote], gameDays: [], courses: [] },
    )
    expect(merged.players.map((p) => p.id).sort()).toEqual(['local', 'remote'])
  })

  it('keeps the locally selected game day when it still exists', () => {
    const day = newGameDay()
    const merged = mergeStates(
      state({ gameDays: [day], currentGameDayId: day.id }),
      { players: [], gameDays: [day], courses: [] },
    )
    expect(merged.currentGameDayId).toBe(day.id)
  })

  it('clears the selection when the day is gone everywhere', () => {
    const merged = mergeStates(
      state({ currentGameDayId: 'ghost' }),
      { players: [], gameDays: [], courses: [] },
    )
    expect(merged.currentGameDayId).toBeNull()
  })
})
