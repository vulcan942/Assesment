import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app.ts'
import { UpstreamError } from '../domain/errors.ts'
import type { CatalogueService } from '../services/catalogue.ts'

const servers: Array<{ close: () => void }> = []
afterEach(() => {
  servers.splice(0).forEach((s) => s.close())
  vi.restoreAllMocks()
})

function start(catalogue: CatalogueService) {
  const server = createApp({ CLIENT_ORIGIN: 'http://localhost:5173' }, { catalogue }).listen(0)
  servers.push(server)
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`
}

const failing = (err: Error): CatalogueService => ({
  getFeatured: async () => {
    throw err
  },
})

describe('GET /api/products/featured', () => {
  it('returns wire products without description or rating', async () => {
    const full = { id: '1', title: 'Shirt', price: 9.5, image: 'i.png', category: 'men', description: 'long', rating: 4.5 }
    const res = await fetch(`${start({ getFeatured: async () => [full] })}/api/products/featured`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: '1', title: 'Shirt', price: 9.5, image: 'i.png', category: 'men' }])
  })

  it('returns 502 with the shared error shape when upstream fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await fetch(`${start(failing(new UpstreamError('boom')))}/api/products/featured`)
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({
      error: { code: 'upstream_unavailable', message: 'Products are unavailable right now. Try again in a moment.' },
    })
  })

  it('does not leak upstream details in a 502', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new UpstreamError('fakestoreapi.com returned 503', { cause: new Error('ECONNRESET') })
    const res = await fetch(`${start(failing(err))}/api/products/featured`)
    expect(await res.text()).not.toMatch(/fakestore|503|ECONNRESET/)
  })

  it('returns a generic 500 without leaking an unexpected error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await fetch(`${start(failing(new Error('secret db password')))}/api/products/featured`)
    const text = await res.text()
    expect(res.status).toBe(500)
    expect(JSON.parse(text).error.code).toBe('internal_error')
    expect(text).not.toMatch(/secret|stack/)
  })
})

describe('unknown API paths', () => {
  it('returns 404 with the shared JSON error shape', async () => {
    const res = await fetch(`${start({ getFeatured: async () => [] })}/api/unknown`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: { code: 'not_found', message: 'We could not find that page.' } })
  })
})
