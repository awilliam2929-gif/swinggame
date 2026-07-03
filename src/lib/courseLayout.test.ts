import { describe, expect, it } from 'vitest'
import { applySavedCourseToGameDay, parTotal } from './courseLayout'
import type { GameDay } from '../store/types'

function baseDay(): GameDay {
  return {
    id: 'd1',
    date: '2026-07-01',
    course: '',
    holeCount: 18,
    pars: Array(18).fill(4),
    attendeeIds: [],
    swingEntrantIds: [],
    swingTeamIds: [],
    swing: { enabled: true, dollarsPerHole: 1, downsN: 0, stacking: false },
    scores: {},
  }
}

describe('courseLayout', () => {
  it('sums par for the active hole count', () => {
    expect(parTotal([4, 4, 3, 5], 9)).toBe(16)
  })

  it('applies saved par layout when a course is selected', () => {
    const next = applySavedCourseToGameDay(baseDay(), {
      id: 'c1',
      name: 'Test GC',
      city: 'Austin',
      state: 'TX',
      subtitle: 'Austin, TX',
      lastUsed: '2026-07-01',
      holeCount: 9,
      pars: [4, 3, 5, 4, 4, 4, 3, 5, 4],
    })

    expect(next.course).toBe('Test GC — Austin, TX')
    expect(next.courseId).toBe('c1')
    expect(next.holeCount).toBe(9)
    expect(next.pars.slice(0, 9)).toEqual([4, 3, 5, 4, 4, 4, 3, 5, 4])
  })
})
