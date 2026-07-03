import type { CourseSearchResult } from '../lib/courseSearch'

export async function fetchCourseSearch(
  query: string,
  signal?: AbortSignal,
): Promise<CourseSearchResult[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const res = await fetch(`/api/course-search?q=${encodeURIComponent(q)}`, {
    signal,
  })

  if (!res.ok) {
    throw new Error('Course search unavailable')
  }

  return (await res.json()) as CourseSearchResult[]
}
