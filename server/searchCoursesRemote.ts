import {
  parseNominatimResults,
} from '../src/lib/courseSearch'

export async function searchCoursesRemote(query: string) {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const searchTerm = /\bgolf\b/i.test(trimmed)
    ? trimmed
    : `${trimmed} golf course`

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('q', searchTerm)
  url.searchParams.set('limit', '12')
  url.searchParams.set('addressdetails', '1')

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'SwingGame/1.0 (https://muneswinggame.netlify.app)',
    },
  })

  if (!res.ok) {
    throw new Error(`Course search failed (${res.status})`)
  }

  const data: unknown = await res.json()
  return parseNominatimResults(data)
}
