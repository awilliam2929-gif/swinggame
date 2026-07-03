import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { fetchCourseSearch } from '../api/courseSearchClient'
import {
  formatCourseLabel,
  type CourseSearchResult,
} from '../lib/courseSearch'
import type { SavedCourse } from '../store/types'

interface CourseFinderProps {
  value: string
  savedCourses: SavedCourse[]
  onChange: (value: string) => void
  onRemember: (course: SavedCourse) => void
}

function toSavedCourse(result: CourseSearchResult): SavedCourse {
  return {
    id: result.id,
    name: result.name,
    city: result.city,
    state: result.state,
    subtitle: result.subtitle,
    lat: result.lat,
    lng: result.lng,
    lastUsed: new Date().toISOString(),
  }
}

function matchesQuery(course: SavedCourse, query: string): boolean {
  const haystack = `${course.name} ${course.city} ${course.state} ${course.subtitle}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

export default function CourseFinder({
  value,
  savedCourses,
  onChange,
  onRemember,
}: CourseFinderProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [remoteResults, setRemoteResults] = useState<CourseSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setRemoteResults([])
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const results = await fetchCourseSearch(trimmed, controller.signal)
        setRemoteResults(results)
      } catch (err) {
        if (controller.signal.aborted) return
        setRemoteResults([])
        setError(
          err instanceof Error ? err.message : 'Could not search courses right now',
        )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [open, query])

  const savedMatches = useMemo(() => {
    const trimmed = query.trim()
    const sorted = [...savedCourses].sort((a, b) =>
      b.lastUsed.localeCompare(a.lastUsed),
    )
    if (!trimmed) return sorted.slice(0, 6)
    return sorted.filter((course) => matchesQuery(course, trimmed)).slice(0, 6)
  }, [query, savedCourses])

  function selectSaved(course: SavedCourse) {
    const label = formatCourseLabel(course)
    setQuery(label)
    onChange(label)
    onRemember(course)
    setOpen(false)
  }

  function selectRemote(result: CourseSearchResult) {
    const saved = toSavedCourse(result)
    const label = formatCourseLabel(saved)
    setQuery(label)
    onChange(label)
    onRemember(saved)
    setOpen(false)
  }

  function commitManualValue() {
    onChange(query.trim())
    setOpen(false)
  }

  const showSaved = savedMatches.length > 0
  const showRemote = query.trim().length >= 2
  const showEmpty =
    open &&
    !loading &&
    !error &&
    showRemote &&
    remoteResults.length === 0 &&
    !showSaved

  return (
    <div className="course-finder" ref={rootRef}>
      <input
        type="text"
        className="course-input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="Search golf courses…"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
          if (e.key === 'Enter') commitManualValue()
        }}
        onBlur={() => {
          window.setTimeout(() => {
            if (!rootRef.current?.contains(document.activeElement)) {
              commitManualValue()
            }
          }, 0)
        }}
      />

      {open && (showSaved || showRemote || loading || error) && (
        <ul className="course-results" id={listId} role="listbox">
          {showSaved && (
            <>
              <li className="course-results-label">Recent courses</li>
              {savedMatches.map((course) => (
                <li key={`saved-${course.id}`}>
                  <button
                    type="button"
                    className="course-result"
                    role="option"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSaved(course)}
                  >
                    <span className="course-result-name">{course.name}</span>
                    {course.subtitle && (
                      <span className="course-result-meta">{course.subtitle}</span>
                    )}
                  </button>
                </li>
              ))}
            </>
          )}

          {showRemote && (
            <>
              <li className="course-results-label">Search results</li>
              {loading && <li className="course-results-status">Searching…</li>}
              {error && <li className="course-results-status error">{error}</li>}
              {!loading &&
                !error &&
                remoteResults.map((result) => (
                  <li key={`remote-${result.id}`}>
                    <button
                      type="button"
                      className="course-result"
                      role="option"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectRemote(result)}
                    >
                      <span className="course-result-name">{result.name}</span>
                      {result.subtitle && (
                        <span className="course-result-meta">{result.subtitle}</span>
                      )}
                    </button>
                  </li>
                ))}
            </>
          )}

          {showEmpty && (
            <li className="course-results-status">
              No courses found. You can still type the name manually.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
