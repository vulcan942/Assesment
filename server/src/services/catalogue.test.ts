import { afterEach, describe, expect, it, vi } from 'vitest'
import { NotFoundError, UpstreamError } from '../domain/errors.ts'
import type { Product } from '../domain/product.ts'
import { fakeProductProvider } from '../../test/helpers.ts'
import { createCatalogueService } from './catalogue.ts'

const p = (id: string): Product => ({ id, title: `Product ${id}` })
const all = ['1', '2', '3', '4', '5'].map(p)

afterEach(() => vi.restoreAllMocks())

describe('getFeatured', () => {
  it('returns products in the configured order', async () => {
    const svc = createCatalogueService({ provider: fakeProductProvider(all), featuredIds: ['3', '1', '2'] })
    expect((await svc.getFeatured()).map((x) => x.id)).toEqual(['3', '1', '2'])
  })

  it('skips a missing product and logs it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const svc = createCatalogueService({ provider: fakeProductProvider(all), featuredIds: ['1', '99', '2'] })
    expect((await svc.getFeatured()).map((x) => x.id)).toEqual(['1', '2'])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('99'))
  })

  it('propagates an upstream error', async () => {
    const svc = createCatalogueService({ provider: fakeProductProvider(all, new UpstreamError('down')), featuredIds: ['1'] })
    await expect(svc.getFeatured()).rejects.toBeInstanceOf(UpstreamError)
  })

  it('works when the configured list is not five ids', async () => {
    const svc = createCatalogueService({ provider: fakeProductProvider(all), featuredIds: ['1', '2'] })
    expect(await svc.getFeatured()).toHaveLength(2)
  })
})

const rated = (id: string, rating?: number, category = 'men'): Product => ({ id, title: `Product ${id}`, category, rating })
const page = (products: Product[], category = 'men') =>
  createCatalogueService({ provider: fakeProductProvider(products), featuredIds: [] }).getCategoryPage(category)
const ids = (products: Product[]) => products.map((x) => x.id)

describe('getCategoryPage', () => {
  it('puts the three highest rated first, best first', async () => {
    const r = await page([rated('1', 3), rated('2', 5), rated('3', 4), rated('4', 4.5), rated('5', 1)])
    expect(ids(r.topRated)).toEqual(['2', '4', '3'])
  })

  it('lists the remaining products after the top rated, in ranking order', async () => {
    const r = await page([rated('1', 3), rated('2', 5), rated('3', 4), rated('4', 4.5), rated('5', 1)])
    expect(ids(r.products)).toEqual(['1', '5'])
  })

  it('breaks rating ties by id with numeric ordering', async () => {
    const r = await page([rated('10', 4), rated('2', 4), rated('1', 4)])
    expect(ids(r.topRated)).toEqual(['1', '2', '10'])
  })

  it('ranks products without a rating last', async () => {
    const r = await page([rated('1'), rated('2', 2), rated('3'), rated('4', 3)])
    expect(ids([...r.topRated, ...r.products])).toEqual(['4', '2', '1', '3'])
  })

  it('never repeats a product between topRated and products', async () => {
    const r = await page([1, 2, 3, 4, 5, 6].map((n) => rated(String(n), n)))
    expect(new Set([...ids(r.topRated), ...ids(r.products)]).size).toBe(6)
  })

  it('leaves products empty when the category has three or fewer', async () => {
    const r = await page([rated('1', 1), rated('2', 2), rated('3', 3)])
    expect(r.products).toEqual([])
  })

  it('only returns products from the requested category', async () => {
    const r = await page([rated('1', 1), rated('2', 2, 'women')])
    expect(ids(r.topRated)).toEqual(['1'])
  })

  it('throws NotFoundError for an unknown category', async () => {
    await expect(page([rated('1', 1)], 'toys')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('treats category names as case sensitive', async () => {
    await expect(page([rated('1', 1)], 'Men')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('returns empty lists for a known category with no products', async () => {
    const provider = { ...fakeProductProvider([]), listCategories: async () => ['men'] }
    const svc = createCatalogueService({ provider, featuredIds: [] })
    expect(await svc.getCategoryPage('men')).toEqual({ topRated: [], products: [] })
  })
})

describe('listCategories', () => {
  it('passes through the provider categories', async () => {
    const provider = fakeProductProvider([rated('1', 1, 'men'), rated('2', 1, 'women')])
    expect(await createCatalogueService({ provider, featuredIds: [] }).listCategories()).toEqual(['men', 'women'])
  })
})
