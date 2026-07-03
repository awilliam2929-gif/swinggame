import type { HoleCount, PlayerId } from '../engine/types'

export type PlayerClass = 'A' | 'B' | 'C'

export interface Player {
  id: PlayerId
  firstName: string
  lastName: string
  nickname: string
  playerClass: PlayerClass
}

export interface SwingSettings {
  enabled: boolean
  dollarsPerHole: number
  downsN: number // 0 = downs off
  stacking: boolean
}

export interface SavedCourse {
  id: string
  name: string
  city: string
  state: string
  subtitle: string
  lat?: number
  lng?: number
  lastUsed: string
}

export interface GameDay {
  id: string
  date: string // yyyy-mm-dd
  course: string
  holeCount: HoleCount
  pars: number[]
  attendeeIds: PlayerId[]
  swingEntrantIds: PlayerId[]
  swingTeamIds: PlayerId[] // 0-2 players, drawn on the course
  swing: SwingSettings
  /** Gross score per attendee per hole; null = not entered yet. */
  scores: Record<PlayerId, (number | null)[]>
}

export interface AppState {
  players: Player[]
  gameDays: GameDay[]
  courses: SavedCourse[]
  currentGameDayId: string | null
}

export function newGameDay(holeCount: HoleCount = 18): GameDay {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    course: '',
    holeCount,
    pars: Array(holeCount).fill(4),
    attendeeIds: [],
    swingEntrantIds: [],
    swingTeamIds: [],
    swing: { enabled: true, dollarsPerHole: 1, downsN: 2, stacking: false },
    scores: {},
  }
}

export function playerLabel(p: Player): string {
  return p.nickname.trim() || `${p.firstName} ${p.lastName}`.trim() || '(unnamed)'
}
