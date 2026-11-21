import type { ErrorRequestHandler } from 'express'
import { NotFoundError, UpstreamError, ValidationError } from '../domain/errors.ts'

// Clients get a fixed message per error type; details stay in the server log.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Express raises status-400 errors for unreadable requests (e.g. bad percent-encoding).
  if (err?.status === 400) {
    console.warn(`${req.method} ${req.path} bad request: ${String(err.message)}`)
    res.status(400).json({ error: { code: 'bad_request', message: 'The request could not be read.' } })
    return
  }
  console.error(`${req.method} ${req.path} failed`, err)
  if (err instanceof UpstreamError) {
    res.status(502).json({ error: { code: 'upstream_unavailable', message: 'Products are unavailable right now. Try again in a moment.' } })
    return
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: { code: 'not_found', message: 'We could not find that.' } })
    return
  }
  if (err instanceof ValidationError) {
    res.status(400).json({ error: { code: 'validation_failed', message: 'Check the highlighted fields.', fields: err.fields } })
    return
  }
  res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong. Try again in a moment.' } })
}
