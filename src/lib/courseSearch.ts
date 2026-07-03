export interface CourseSearchResult {
  id: string
  name: string
  city: string
  state: string
  subtitle: string
  lat: number
  lng: number
}

interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  state?: string
  country?: string
}

export interface NominatimItem {
  place_id?: number
  osm_id?: number
  name?: string
  display_name?: string
  lat?: string
  lon?: string
  type?: string
  category?: string
  class?: string
  address?: NominatimAddress
}

export function formatCourseLabel(course: {
  name: string
  city?: string
  state?: string
}): string {
  const place = [course.city, course.state].filter(Boolean).join(', ')
  return place ? `${course.name} — ${place}` : course.name
}

export function isGolfRelated(item: NominatimItem): boolean {
  if (item.type === 'golf_course') return true
  if (item.category === 'leisure' && item.type === 'golf_course') return true

  const haystack = `${item.name ?? ''} ${item.display_name ?? ''}`.toLowerCase()
  return (
    haystack.includes('golf') ||
    haystack.includes('country club') ||
    haystack.includes(' links') ||
    haystack.startsWith('links ')
  )
}

function cityFromAddress(address?: NominatimAddress): string {
  if (!address) return ''
  return (
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.county ??
    ''
  )
}

export function parseNominatimResults(data: unknown): CourseSearchResult[] {
  if (!Array.isArray(data)) return []

  const seen = new Set<string>()
  const results: CourseSearchResult[] = []

  for (const raw of data) {
    const item = raw as NominatimItem
    if (!isGolfRelated(item)) continue

    const name =
      item.name?.trim() ||
      item.display_name?.split(',')[0]?.trim() ||
      'Golf course'
    const city = cityFromAddress(item.address)
    const state = item.address?.state?.trim() ?? ''
    const lat = Number(item.lat)
    const lng = Number(item.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

    const dedupeKey = `${name.toLowerCase()}|${city.toLowerCase()}|${state.toLowerCase()}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    const subtitle = [city, state].filter(Boolean).join(', ')
    results.push({
      id: String(item.osm_id ?? item.place_id),
      name,
      city,
      state,
      subtitle: subtitle || item.display_name?.split(',').slice(1, 3).join(',').trim() || '',
      lat,
      lng,
    })
  }

  return results
}
