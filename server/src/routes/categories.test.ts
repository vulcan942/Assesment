import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../app.ts'
import { NotFoundError, UpstreamError } from '../domain/errors.ts'
import type { Product } from '../domain/product.ts'
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
const stub = (o: Partial<CatalogueService>): CatalogueService => ({
  getFeatured: reject,
  listCategories: reject,
  getCategoryPage: reject,
  search: reject,
  ...o,
})
const failWith = (err: Error) => async (): Promise<never> => {
  throw err
}

const full: Product = { id: '1', title: 'Shirt', price: 9.5, image: 'i.png', category: 'men', description: 'long', rating: 4.5 }
const card = { id: '1', title: 'Shirt', price: 9.5, image: 'i.png', category: 'men' }

describe('GET /api/categories', () => {
  it('returns the category names', async () => {
    const res = await fetch(`${start(stub({ listCategories: async () => ['men', 'jewelery'] }))}/api/categories`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(['men', 'jewelery'])
  })

  it('returns 502 when upstream fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await fetch(`${start(stub({ listCategories: failWith(new UpstreamError('boom')) }))}/api/categories`)
    expect(res.status).toBe(502)
  })
})

describe('GET /api/categories/:category/products', () => {
  it('returns cards without rating or description, plus paging fields', async () => {
    const base = start(stub({ getCategoryPage: async () => ({ topRated: [full], products: [{ ...full, id: '2' }, { ...full, id: '3' }] }) }))
    const res = await fetch(`${base}/api/categories/men/products`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      topRated: [card],
      products: [{ ...card, id: '2' }, { ...card, id: '3' }],
      page: 1,
      pageSize: 2,
      total: 2,
    })
  })

  it('passes the decoded category to the service', async () => {
    const getCategoryPage = vi.fn(async (_category: string) => ({ topRated: [], products: [] }))
    await fetch(`${start(stub({ getCategoryPage }))}/api/categories/women%20clothing/products`)
    expect(getCategoryPage).toHaveBeenCalledWith('women clothing')
  })

  it('ignores page and pageSize query params', async () => {
    const base = start(stub({ getCategoryPage: async () => ({ topRated: [], products: [full] }) }))
    const body = await (await fetch(`${base}/api/categories/men/products?page=5&pageSize=1`)).json()
    expect(body).toMatchObject({ page: 1, pageSize: 1, total: 1 })
  })

  it('returns 404 with the shared error shape for an unknown category', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const base = start(stub({ getCategoryPage: failWith(new NotFoundError('Unknown category x')) }))
    const res = await fetch(`${base}/api/categories/x/products`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: { code: 'not_found', message: 'We could not find that.' } })
  })

  it('returns 400 bad_request for a malformed percent-encoded path', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = await fetch(`${start(stub({}))}/api/categories/%E0%A4%A/products`)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: { code: 'bad_request', message: 'The request could not be read.' } })
  })

  it('returns 400 with fields for a blank category', async () => {
    const res = await fetch(`${start(stub({}))}/api/categories/%20/products`)
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: { code: string; fields: object } }
    expect(body.error.code).toBe('validation_failed')
    expect(Object.keys(body.error.fields)).toEqual(['category'])
  })

  it('returns 400 for a category over 64 characters', async () => {
    const res = await fetch(`${start(stub({}))}/api/categories/${'a'.repeat(65)}/products`)
    expect(res.status).toBe(400)
  })

  it('returns 502 when upstream fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const base = start(stub({ getCategoryPage: failWith(new UpstreamError('boom')) }))
    const res = await fetch(`${base}/api/categories/men/products`)
    expect(res.status).toBe(502)
  })
})

describe('category endpoints with the real service and a fake provider', () => {
  const products = [1, 2, 3, 4, 5].map((n): Product => ({ ...full, id: String(n), rating: n }))
  const real = () => start(createCatalogueService({ provider: fakeProductProvider(products), featuredIds: [] }))

  it('returns the top three by rating then the rest', async () => {
    const body = (await (await fetch(`${real()}/api/categories/men/products`)).json()) as { topRated: Product[]; products: Product[] }
    expect(body.topRated.map((p) => p.id)).toEqual(['5', '4', '3'])
    expect(body.products.map((p) => p.id)).toEqual(['2', '1'])
  })

  type Body = { topRated: Product[]; products: Product[] }
  const fetchIds = async (list: Product[]) => {
    const base = start(createCatalogueService({ provider: fakeProductProvider(list), featuredIds: [] }))
    const body = (await (await fetch(`${base}/api/categories/men/products`)).json()) as Body
    return { top: body.topRated.map((p) => p.id), rest: body.products.map((p) => p.id), body }
  }
  const withRatings = (ratings: Array<number | undefined>) =>
    ratings.map((rating, n): Product => ({ ...full, id: String(n + 1), rating }))

  it('orders equal ratings by id across the top three and the rest', async () => {
    const { top, rest } = await fetchIds(withRatings([4, 4, 4, 4, 4]).reverse())
    expect(top).toEqual(['1', '2', '3'])
    expect(rest).toEqual(['4', '5'])
  })

  it('puts a product with no rating after every rated one', async () => {
    const { top, rest } = await fetchIds(withRatings([undefined, 1, 2, 3]))
    expect(top).toEqual(['4', '3', '2'])
    expect(rest).toEqual(['1'])
  })

  it('returns exactly three top rated and none more when the category has three products', async () => {
    const { top, rest } = await fetchIds(withRatings([1, 2, 3]))
    expect(top).toHaveLength(3)
    expect(rest).toEqual([])
  })

  it('returns three top rated and one more when the category has four products', async () => {
    const { top, rest, body } = await fetchIds(withRatings([1, 2, 3, 4]))
    expect(top).toEqual(['4', '3', '2'])
    expect(rest).toEqual(['1'])
    expect(body.products).toHaveLength(1)
  })

  it('returns 404 for an unknown category', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await fetch(`${real()}/api/categories/toys/products`)).status).toBe(404)
  })
})
