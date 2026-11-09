/** Keep return destinations on this site, even when they came from a URL or browser storage. */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/'
  try {
    const base = 'https://apexcaliber.invalid'
    const target = new URL(value, base)
    if (target.origin !== base || /^\/(?:sign-in|auth\/callback)(?:\/|$)/.test(target.pathname)) return '/'
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return '/'
  }
}

export function signInPath(returnTo: string): string {
  return `/sign-in?next=${encodeURIComponent(safeReturnPath(returnTo))}`
}

export const AUTH_RETURN_KEY = 'apex-auth-return'
