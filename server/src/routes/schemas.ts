import { z } from 'zod'

// Word characters and hyphen only: the Fake Store adapter puts the id in a URL path, so ".", ".." and "/" must never reach it.
export const idSchema = z.string().regex(/^[\w-]+$/).max(64)
