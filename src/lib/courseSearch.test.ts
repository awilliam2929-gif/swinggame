import { describe, expect, it } from 'vitest'
import {
  formatCourseLabel,
  isGolfRelated,
  parseNominatimResults,
} from './courseSearch'

describe('courseSearch', () => {
  it('formats course labels with city and state', () => {
    expect(
      formatCourseLabel({
        name: 'TPC Scottsdale',
        city: 'Scottsdale',
        state: 'Arizona',
      }),
    ).toBe('TPC Scottsdale — Scottsdale, Arizona')
  })

  it('detects golf-related nominatim results', () => {
    expect(isGolfRelated({ type: 'golf_course', name: 'Example' })).toBe(true)
    expect(
      isGolfRelated({ name: 'Oakmont Country Club', display_name: 'Oakmont' }),
    ).toBe(true)
    expect(isGolfRelated({ name: 'City Library', display_name: 'Library' })).toBe(
      false,
    )
  })

  it('parses nominatim golf course results', () => {
    const results = parseNominatimResults([
      {
        place_id: 1,
        osm_id: 99,
        name: 'TPC Scottsdale',
        lat: '33.6',
        lon: '-111.9',
        type: 'golf_course',
        address: { city: 'Scottsdale', state: 'Arizona' },
      },
      {
        place_id: 2,
        name: 'Public Library',
        lat: '33.6',
        lon: '-111.9',
        type: 'library',
      },
    ])

    expect(results).toHaveLength(1)
    expect(results[0]?.name).toBe('TPC Scottsdale')
    expect(results[0]?.city).toBe('Scottsdale')
    expect(results[0]?.state).toBe('Arizona')
  })
})
