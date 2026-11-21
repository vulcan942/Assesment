import { afterEach, describe, expect, it, vi } from 'vitest'
import { UpstreamError } from '../domain/errors.ts'
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
