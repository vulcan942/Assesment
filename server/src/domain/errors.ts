// Provider failed, timed out or returned malformed data. The cause is kept for server logs only.
export class UpstreamError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'UpstreamError'
  }
}
