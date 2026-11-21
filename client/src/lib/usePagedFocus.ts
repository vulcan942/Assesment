import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

// After a Previous/Next click the new page remounts; move focus to the h1 and scroll to the top
// so keyboard and screen reader users start at the new results.
export function usePagedFocus() {
  const ref = useRef<HTMLHeadingElement>(null)
  const location = useLocation()
  const paged = (location.state as { paged?: boolean } | null)?.paged === true

  useEffect(() => {
    if (!paged) return
    ref.current?.focus()
    window.scrollTo(0, 0)
  }, [paged])

  return ref
}
