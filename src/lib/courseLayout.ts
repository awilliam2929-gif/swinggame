import type { HoleCount } from '../engine/types'
import type { GameDay, SavedCourse } from '../store/types'
import { formatCourseLabel } from './courseSearch'

export function parTotal(pars: number[], holeCount: HoleCount): number {
  return pars.slice(0, holeCount).reduce((sum, p) => sum + p, 0)
}

export function mergeSavedCourse(
  existing: SavedCourse | undefined,
  incoming: SavedCourse,
): SavedCourse {
  return {
    ...existing,
    ...incoming,
    pars: incoming.pars ?? existing?.pars,
    holeCount: incoming.holeCount ?? existing?.holeCount,
  }
}

export function layoutFromGameDay(gameDay: GameDay): Pick<SavedCourse, 'holeCount' | 'pars'> {
  const holeCount = gameDay.holeCount
  const pars = gameDay.pars.slice(0, Math.max(holeCount, gameDay.pars.length))
  return { holeCount, pars }
}

/** Apply a saved course label and optional remembered par layout to a game day patch. */
export function applySavedCourseToGameDay(
  gameDay: GameDay,
  course: SavedCourse,
): GameDay {
  const next: GameDay = {
    ...gameDay,
    course: formatCourseLabel(course),
    courseId: course.id,
  }

  if (course.holeCount && course.pars && course.pars.length >= course.holeCount) {
    const holeCount = course.holeCount
    const parLen = Math.max(holeCount, course.pars.length, gameDay.pars.length)
    const pars = Array.from({ length: parLen }, (_, i) => course.pars![i] ?? 4)
    const scores: GameDay['scores'] = {}
    for (const [pid, arr] of Object.entries(gameDay.scores)) {
      const len = Math.max(holeCount, arr.length)
      scores[pid] = Array.from({ length: len }, (_, i) => arr[i] ?? null)
    }
    next.holeCount = holeCount
    next.pars = pars
    next.scores = scores
  }

  return next
}

export function savedCourseFromManual(
  courseLabel: string,
  layout: Pick<SavedCourse, 'holeCount' | 'pars'>,
): SavedCourse {
  const name = courseLabel.split('—')[0]?.trim() || courseLabel.trim()
  return {
    id: crypto.randomUUID(),
    name,
    city: '',
    state: '',
    subtitle: courseLabel.includes('—')
      ? courseLabel.split('—').slice(1).join('—').trim()
      : '',
    lastUsed: new Date().toISOString(),
    ...layout,
  }
}

export function formatSavedCourseMeta(course: SavedCourse): string | null {
  if (!course.pars?.length || !course.holeCount) return null
  const total = parTotal(course.pars, course.holeCount)
  return `Par ${total} · ${course.holeCount} holes saved`
}
