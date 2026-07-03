/**
 * Write-through sync to Supabase.
 *
 * The reducer stays the single source of truth; after every state change
 * the engine diffs old vs new state by object identity and pushes only the
 * entities that changed. Upserts are debounced per entity (score entry
 * fires an update per keystroke), deletes go out immediately.
 * localStorage still gets every state as the offline cache.
 */

import { supabase } from '../lib/supabase'
import type { AppState, GameDay, Player, SavedCourse } from '../store/types'

export const TABLES = {
  players: 'sg_players',
  gameDays: 'sg_game_days',
  courses: 'sg_courses',
} as const

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error'

interface Entity {
  id: string
}

const DEBOUNCE_MS = 800

export class SyncEngine {
  private prev: AppState | null = null
  private timers = new Map<string, ReturnType<typeof setTimeout>>()
  private pending = new Map<string, { table: string; entity: Entity }>()
  private inflight = 0
  private enabled = false

  constructor(private onStatus: (s: SyncStatus) => void) {}

  /** Set the baseline (post-hydration) state and start syncing. */
  prime(state: AppState) {
    this.prev = state
    this.enabled = true
  }

  stop() {
    this.enabled = false
    for (const t of this.timers.values()) clearTimeout(t)
    this.timers.clear()
    this.pending.clear()
  }

  push(next: AppState) {
    if (!this.enabled || !supabase || !this.prev) return
    this.diff(TABLES.players, this.prev.players, next.players)
    this.diff(TABLES.gameDays, this.prev.gameDays, next.gameDays)
    this.diff(TABLES.courses, this.prev.courses, next.courses)
    this.prev = next
  }

  private diff(table: string, prevList: Entity[], nextList: Entity[]) {
    if (prevList === nextList) return
    const prevById = new Map(prevList.map((e) => [e.id, e]))
    for (const entity of nextList) {
      const old = prevById.get(entity.id)
      if (old !== entity) this.scheduleUpsert(table, entity)
      prevById.delete(entity.id)
    }
    for (const id of prevById.keys()) void this.deleteNow(table, id)
  }

  private key(table: string, id: string) {
    return `${table}:${id}`
  }

  private scheduleUpsert(table: string, entity: Entity) {
    const k = this.key(table, entity.id)
    this.pending.set(k, { table, entity })
    const existing = this.timers.get(k)
    if (existing) clearTimeout(existing)
    this.onStatus('syncing')
    this.timers.set(
      k,
      setTimeout(() => void this.flushUpsert(k), DEBOUNCE_MS),
    )
  }

  private async flushUpsert(k: string) {
    const item = this.pending.get(k)
    this.pending.delete(k)
    this.timers.delete(k)
    if (!item || !supabase) return
    this.inflight++
    const { error } = await supabase.from(item.table).upsert({
      id: item.entity.id,
      data: item.entity,
      updated_at: new Date().toISOString(),
    })
    this.inflight--
    this.settle(error)
  }

  private async deleteNow(table: string, id: string) {
    const k = this.key(table, id)
    const timer = this.timers.get(k)
    if (timer) clearTimeout(timer)
    this.timers.delete(k)
    this.pending.delete(k)
    if (!supabase) return
    this.inflight++
    this.onStatus('syncing')
    const { error } = await supabase.from(table).delete().eq('id', id)
    this.inflight--
    this.settle(error)
  }

  private settle(error: unknown) {
    if (error) {
      console.error('Supabase sync error:', error)
      this.onStatus('error')
      return
    }
    if (this.inflight === 0 && this.pending.size === 0) {
      this.onStatus('synced')
    }
  }
}

export interface RemoteState {
  players: Player[]
  gameDays: GameDay[]
  courses: SavedCourse[]
}

export async function fetchRemoteState(): Promise<RemoteState> {
  if (!supabase) throw new Error('Supabase not configured')
  const [players, gameDays, courses] = await Promise.all([
    supabase.from(TABLES.players).select('data'),
    supabase.from(TABLES.gameDays).select('data'),
    supabase.from(TABLES.courses).select('data'),
  ])
  for (const res of [players, gameDays, courses]) {
    if (res.error) throw res.error
  }
  return {
    players: (players.data ?? []).map((r) => r.data as Player),
    gameDays: (gameDays.data ?? []).map((r) => r.data as GameDay),
    courses: (courses.data ?? []).map((r) => r.data as SavedCourse),
  }
}

/**
 * Union merge: the server copy wins for any entity both sides know;
 * local-only entities (created offline or pre-migration) survive and get
 * pushed up by the engine afterwards.
 */
export function mergeStates(local: AppState, remote: RemoteState): AppState {
  const merge = <T extends Entity>(loc: T[], rem: T[]): T[] => {
    const remoteIds = new Set(rem.map((e) => e.id))
    return [...rem, ...loc.filter((e) => !remoteIds.has(e.id))]
  }
  const gameDays = merge(local.gameDays, remote.gameDays)
  const currentGameDayId =
    local.currentGameDayId &&
    gameDays.some((g) => g.id === local.currentGameDayId)
      ? local.currentGameDayId
      : null
  return {
    players: merge(local.players, remote.players),
    gameDays,
    courses: merge(local.courses, remote.courses),
    currentGameDayId,
  }
}
