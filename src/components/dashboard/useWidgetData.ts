'use client'

import { useCallback, useEffect, useState } from 'react'

// Fetches a JSON endpoint for a dashboard widget and exposes loading/error/reload
export function useWidgetData<T>(url: string, pick: (json: unknown) => T) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const load = useCallback(() => {
    return fetch(url, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`${url} ${res.status}`)
        return res.json()
      })
      .then(
        (json) => {
          setData(pick(json))
          setError(false)
          setUpdatedAt(new Date())
          setLoading(false)
        },
        () => {
          setError(true)
          setLoading(false)
        },
      )
    // pick is expected to be a stable module-level function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  useEffect(() => {
    load()
  }, [load])

  const reload = useCallback(() => {
    setLoading(true)
    load()
  }, [load])

  return { data, loading, error, updatedAt, reload }
}
