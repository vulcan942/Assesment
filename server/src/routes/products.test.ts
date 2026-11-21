import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app.ts'
import { UpstreamError } from '../domain/errors.ts'
import { createCatalogueService, type CatalogueService } from '../services/catalogue.ts'
import { fakeProductProvider } from '../../test/helpers.ts'

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

const reject = async (): Promise<never> => {
  throw new Error('not used')
}
const stub = (overrides: Partial<CatalogueService>): CatalogueService => ({
  getFeatured: reject,
  listCategories: reject,
  getCategoryPage: reject,
  search: reject,
  ...overrides,
})
const failing = (err: Error): CatalogueService =>
  stub({
    getFeatured: async () => {
      throw err
    },
  })

describe('GET /api/products/featured', () => {
  it('returns wire products without description or rating', async () => {
    const full = { id: '1', title: 'Shirt', price: 9.5, image: 'i.png', category: 'men', description: 'long', rating: 4.5 }
    const res = await fetch(`${start(stub({ getFeatured: async () => [full] }))}/api/products/featured`)
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

describe('GET /api/products (search)', () => {
  const full = { id: '1', title: 'Red Shirt', price: 9.5, image: 'i.png', category: 'men', description: 'long', rating: 4.5 }
  const withProducts = () =>
    start(createCatalogueService({ provider: fakeProductProvider([full, { ...full, id: '2', title: 'Hat' }]), featuredIds: [] }))
  const validation = (q: string) => ({
    error: { code: 'validation_failed', message: 'Check the highlighted fields.', fields: { q } },
  })

  it('returns wire products without description or rating and paging totals', async () => {
    const res = await fetch(`${withProducts()}/api/products?q=shirt`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      products: [{ id: '1', title: 'Red Shirt', price: 9.5, image: 'i.png', category: 'men' }],
      page: 1,
      pageSize: 1,
      total: 1,
    })
  })

  it('returns 200 with an empty list when nothing matches', async () => {
    const res = await fetch(`${withProducts()}/api/products?q=zzz`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ products: [], page: 1, pageSize: 0, total: 0 })
  })

  it('returns 400 with fields.q when q is missing', async () => {
    const res = await fetch(`${withProducts()}/api/products`)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual(validation('Enter a word to search for.'))
  })

  it('returns 400 when q is empty', async () => {
    const res = await fetch(`${withProducts()}/api/products?q=`)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual(validation('Enter a word to search for.'))
  })

  it('returns 400 when q is only whitespace', async () => {
    const res = await fetch(`${withProducts()}/api/products?q=%20%20%20`)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual(validation('Enter a word to search for.'))
  })

  it('returns 400 when q is longer than 100 characters', async () => {
    const res = await fetch(`${withProducts()}/api/products?q=${'a'.repeat(101)}`)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual(validation('Use 100 characters or fewer.'))
  })

  it('accepts q of exactly 100 characters', async () => {
    const res = await fetch(`${withProducts()}/api/products?q=${'a'.repeat(100)}`)
    expect(res.status).toBe(200)
  })

  it('trims and collapses spaces in q before searching', async () => {
    const search = vi.fn(async () => [])
    await fetch(`${start(stub({ search }))}/api/products?q=%20%20red%20%20%20shirt%20`)
    expect(search).toHaveBeenCalledWith('red shirt')
  })

  describe('with a fake provider', () => {
    const base = { price: 1, image: 'i.png', category: 'men' }
    const catalogue = () =>
      start(
        createCatalogueService({
          provider: fakeProductProvider([
            { ...base, id: '1', title: 'Red shirt', description: 'Soft cotton' },
            { ...base, id: '2', title: 'Plain hat', description: 'Made of red wool' },
            { ...base, id: '3', title: 'Bare scarf' },
          ]),
          featuredIds: [],
        }),
      )
    const idsFor = async (q: string) => {
      const body = (await (await fetch(`${catalogue()}/api/products?q=${q}`)).json()) as { products: { id: string }[] }
      return body.products.map((x) => x.id)
    }

    it('returns products matching in title or description and excludes the rest', async () => {
      expect(await idsFor('red')).toEqual(['1', '2'])
    })

    it('returns the same results for spaced-out and single-spaced terms', async () => {
      expect(await idsFor('%20red%20%20%20shirt')).toEqual(await idsFor('red%20shirt'))
    })

    it('does not fail on products without a description', async () => {
      expect(await idsFor('bare')).toEqual(['3'])
    })
  })

  it('returns 400 instead of 500 when q is repeated', async () => {
    const res = await fetch(`${withProducts()}/api/products?q=a&q=b`)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual(validation('Enter a word to search for.'))
  })

  it('returns 502 when upstream fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const search = async (): Promise<never> => {
      throw new UpstreamError('boom')
    }
    const res = await fetch(`${start(stub({ search }))}/api/products?q=a`)
    expect(res.status).toBe(502)
  })
})

describe('unknown API paths', () => {
  it('returns 404 with the shared JSON error shape', async () => {
    const res = await fetch(`${start(stub({ getFeatured: async () => [] }))}/api/unknown`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: { code: 'not_found', message: 'We could not find that page.' } })
  })
})
