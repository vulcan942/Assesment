import type { ErrorRequestHandler } from 'express'
import { UpstreamError } from '../domain/errors.ts'

// Clients get a fixed message per error type; details stay in the server log.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  console.error(`${req.method} ${req.path} failed`, err)
  if (err instanceof UpstreamError) {
    res.status(502).json({ error: { code: 'upstream_unavailable', message: 'Products are unavailable right now. Try again in a moment.' } })
    return
  }
  res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong. Try again in a moment.' } })
}
