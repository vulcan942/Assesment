// Provider failed, timed out or returned malformed data. The cause is kept for server logs only.
export class UpstreamError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'UpstreamError'
  }
}

// Requested thing does not exist. Message is for logs only.
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

// Request input failed validation. `fields` maps field name to a message safe to show the customer.
export class ValidationError extends Error {
  readonly fields: Record<string, string>
  constructor(fields: Record<string, string>) {
    super('Validation failed')
    this.fields = fields
    this.name = 'ValidationError'
  }
}
