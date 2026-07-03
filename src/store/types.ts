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
  /** Remembered par layout from a prior visit — always editable on load. */
  holeCount?: HoleCount
  pars?: number[]
  lastUsed: string
}

export interface SideBetsSettings {
  skins: {
    enabled: boolean
    ante: number
    /**
     * Greenies (closest to the pin on par 3s) are part of the skins
     * buy-in: each greenie is one share of the same pot, equal to a skin.
     */
    greenies: boolean
    entrantIds: PlayerId[]
  }
  birdies: {
    enabled: boolean
    birdie: number
    eagle: number
    albatross: number
    entrantIds: PlayerId[]
  }
}

/** Shape stored by builds where greenies were a separate bet. */
interface LegacySideBets {
  skins?: { enabled?: boolean; ante?: number; entrantIds?: PlayerId[] }
  birdies?: SideBetsSettings['birdies']
  greenies?: { enabled?: boolean; amount?: number; entrantIds?: PlayerId[] }
}

export interface GameDay {
  id: string
  date: string // yyyy-mm-dd
  course: string
  /** Links to a saved course template when picked from the finder. */
  courseId?: string
  holeCount: HoleCount
  pars: number[]
  attendeeIds: PlayerId[]
  swingEntrantIds: PlayerId[]
  swingTeamIds: PlayerId[] // 0-2 players, drawn on the course
  swing: SwingSettings
  sideBets?: SideBetsSettings
  /** CTP winner per 0-based par-3 hole index; absent/null = nobody. */
  greenieWinners?: Record<number, PlayerId | null>
  /** Gross score per attendee per hole; null = not entered yet. */
  scores: Record<PlayerId, (number | null)[]>
}

export interface AppState {
  players: Player[]
  gameDays: GameDay[]
  courses: SavedCourse[]
  currentGameDayId: string | null
}

export function defaultSideBets(): SideBetsSettings {
  return {
    skins: { enabled: false, ante: 5, greenies: true, entrantIds: [] },
    birdies: {
      enabled: false,
      birdie: 1,
      eagle: 5,
      albatross: 25,
      entrantIds: [],
    },
  }
}

/**
 * Normalizes whatever shape is stored (including the legacy one where
 * greenies were a separate bet with their own dollar amount) into the
 * current shape. Legacy greenies fold into the skins pot toggle.
 */
export function sideBetsFor(gameDay: GameDay): SideBetsSettings {
  const stored = gameDay.sideBets as LegacySideBets | undefined
  const defaults = defaultSideBets()
  if (!stored) return defaults
  const legacyGreenies =
    stored.greenies?.enabled ??
    (stored.skins as { greenies?: boolean } | undefined)?.greenies
  return {
    skins: {
      enabled: stored.skins?.enabled ?? false,
      ante: stored.skins?.ante ?? defaults.skins.ante,
      greenies: legacyGreenies ?? defaults.skins.greenies,
      entrantIds: stored.skins?.entrantIds ?? [],
    },
    birdies: stored.birdies ?? defaults.birdies,
  }
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
    sideBets: defaultSideBets(),
    scores: {},
  }
}

export function playerLabel(p: Player): string {
  return p.nickname.trim() || `${p.firstName} ${p.lastName}`.trim() || '(unnamed)'
}
