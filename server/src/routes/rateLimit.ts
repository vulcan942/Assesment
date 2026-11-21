import type { RequestHandler } from 'express'

// IPv6 clients usually own a whole /64, so rotating inside it must not buy fresh quota.
// IPv4-mapped addresses (::ffff:a.b.c.d) count as the IPv4 address itself.
export function rateLimitKey(ip: string): string {
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip)
  if (mapped) return mapped[1]!
  if (!ip.includes(':')) return ip

  const [head = '', tail] = ip.split('%')[0]!.split('::')
  const headParts = head ? head.split(':') : []
  const tailParts = tail ? tail.split(':') : []
  const zeros = Array(Math.max(0, 8 - headParts.length - tailParts.length)).fill('0') as string[]
  const hextets = [...headParts, ...zeros, ...tailParts].slice(0, 4)
  return hextets.map((h) => parseInt(h, 16).toString(16)).join(':') + '::/64'
}

// Sliding window per client, kept in this instance's memory.
// ponytail: per process and lost on restart; use a shared store if the server scales out.
export function createRateLimit(options: { limit: number; windowMs: number; now?: () => number }): RequestHandler {
  const { limit, windowMs, now = Date.now } = options
  const hits = new Map<string, number[]>()
  let lastPrune = now()

  return (req, res, next) => {
    const time = now()
    // Drop idle keys at most once per window so the map stays bounded without an O(n) scan per request.
    if (time - lastPrune >= windowMs) {
      lastPrune = time
      for (const [k, stamps] of hits) {
        if (stamps.every((t) => t <= time - windowMs)) hits.delete(k)
      }
    }

    const key = rateLimitKey(req.ip ?? 'unknown')
    const times = (hits.get(key) ?? []).filter((t) => t > time - windowMs)
    if (times.length >= limit) {
      const retryAfter = Math.ceil((times[0]! + windowMs - time) / 1000)
      console.warn(`enquiry rate limited ip=${key}`)
      res.setHeader('Retry-After', String(retryAfter))
      res.status(429).json({ error: { code: 'rate_limited', message: 'You have sent several enquiries. Try again in a few minutes.' } })
      return
    }
    times.push(time)
    hits.set(key, times)
    next()
  }
}
