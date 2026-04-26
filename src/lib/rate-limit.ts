/**
 * In-process sliding-window rate limiter.
 *
 * Works within a single warm serverless instance.
 * For true distributed limiting across Vercel deployments,
 * replace with @upstash/ratelimit + @upstash/redis:
 *   https://github.com/upstash/ratelimit
 *
 * Usage:
 *   const result = rateLimit(ip, 'generate', 10, 60_000)
 *   if (!result.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
 */

interface Entry {
  count:     number
  windowStart: number
}

// Module-level store — shared across requests on the same warm instance
const store = new Map<string, Entry>()

// Periodically clean up expired entries to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    Array.from(store.entries()).forEach(([key, entry]) => {
      if (now - entry.windowStart > 300_000) store.delete(key) // 5min max TTL
    })
  }, 60_000)
}

/**
 * Check and increment a rate limit bucket.
 * @param identifier  IP address or user ID
 * @param action      Bucket name (e.g. 'generate', 'upload')
 * @param limit       Max requests allowed in the window
 * @param windowMs    Window duration in milliseconds
 */
export function rateLimit(
  identifier: string,
  action: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; resetMs: number } {
  const key = `${action}:${identifier}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now })
    return { ok: true, remaining: limit - 1, resetMs: now + windowMs }
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0, resetMs: entry.windowStart + windowMs }
  }

  entry.count++
  return { ok: true, remaining: limit - entry.count, resetMs: entry.windowStart + windowMs }
}

/**
 * Extract the best available client identifier from a request.
 * Prefers Vercel's forwarded IP, then X-Real-IP, then X-Forwarded-For.
 */
export function getClientId(request: Request): string {
  const ip =
    request.headers.get('x-vercel-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'

  // Anonymize IPv4 to /24 subnet, IPv6 to /48
  return anonymizeIp(ip)
}

/**
 * Anonymize an IP address for rate-limit keying and storage.
 * IPv4: zero out last octet   (1.2.3.4   → 1.2.3.0)
 * IPv6: keep first 48 bits    (2001:db8::1 → 2001:db8::)
 */
export function anonymizeIp(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown'

  // IPv4
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/)
  if (v4) return `${v4[1]}.${v4[2]}.${v4[3]}.0`

  // IPv6 — keep first 3 groups
  if (ip.includes(':')) {
    const groups = ip.split(':')
    return groups.slice(0, 3).join(':') + '::'
  }

  return 'unknown'
}
