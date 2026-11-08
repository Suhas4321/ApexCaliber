import { useEffect, useState } from 'react'
import { accessToken, currentStudentId, hostedAuthEnabled } from './auth'

export const SYSTEM_DESIGN_STORAGE_KEY = 'pf_sysdesign_completed_v1'
export const SYSTEM_DESIGN_TOTAL_ASSIGNMENTS = 20
export const SYSTEM_DESIGN_PROGRESS_EVENT = 'pf_sysdesign_progress_updated'

function storageKey() {
  return hostedAuthEnabled ? `${SYSTEM_DESIGN_STORAGE_KEY}:${currentStudentId() || 'guest'}` : SYSTEM_DESIGN_STORAGE_KEY
}

export function getSystemDesignCompletedIds(): string[] {
  try {
    const raw = localStorage.getItem(storageKey())
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function markSystemDesignCompleted(id: string): string[] {
  try {
    if (hostedAuthEnabled && !currentStudentId()) {
      const next = window.location.pathname + window.location.search
      window.location.assign(`/sign-in?next=${encodeURIComponent(next)}`)
      return getSystemDesignCompletedIds()
    }
    const current = getSystemDesignCompletedIds()
    if (current.includes(id)) return current
    const updated = [...current, id]
    localStorage.setItem(storageKey(), JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent(SYSTEM_DESIGN_PROGRESS_EVENT, { detail: { id, completedIds: updated } }))
    if (hostedAuthEnabled) {
      void accessToken().then(token => fetch(`/api/me/system-design/${encodeURIComponent(id)}`, {
        method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {},
      })).then(res => {
        if (res.ok) return
        const corrected = getSystemDesignCompletedIds().filter(item => item !== id)
        localStorage.setItem(storageKey(), JSON.stringify(corrected))
        window.dispatchEvent(new Event(SYSTEM_DESIGN_PROGRESS_EVENT))
      }).catch(() => {})
    }
    return updated
  } catch {
    return getSystemDesignCompletedIds()
  }
}

export function getSystemDesignStats() {
  const completedIds = getSystemDesignCompletedIds()
  const solved = completedIds.length
  const total = SYSTEM_DESIGN_TOTAL_ASSIGNMENTS
  const pct = total > 0 ? Math.min(100, Math.round((solved / total) * 100)) : 0
  return {
    solved,
    total,
    pct,
    completedIds,
  }
}

export function useSystemDesignProgress() {
  const [stats, setStats] = useState(getSystemDesignStats)

  useEffect(() => {
    const sync = () => setStats(getSystemDesignStats())
    window.addEventListener(SYSTEM_DESIGN_PROGRESS_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(SYSTEM_DESIGN_PROGRESS_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return stats
}
