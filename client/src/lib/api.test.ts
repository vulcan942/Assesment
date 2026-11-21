// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, getCategoryPage, getFeatured, searchProducts, sendEnquiry } from './api'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const stubFetch = (impl: (url: string, init?: RequestInit) => Promise<Response>) => {
  const fn = vi.fn(impl)
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('api', () => {
  it('returns parsed JSON from /api on success', async () => {
    const fn = stubFetch(async () => json([{ id: 1, title: 'A' }]))
    await expect(getFeatured()).resolves.toEqual([{ id: 1, title: 'A' }])
    expect(fn.mock.calls[0][0]).toBe('/api/products/featured')
  })

  it('throws ApiError with status, code, message and fields from the error shape', async () => {
    stubFetch(async () =>
      json({ error: { code: 'validation_failed', message: 'Check the highlighted fields.', fields: { email: 'Enter a valid email address.' } } }, 400),
    )
    const error = await sendEnquiry({ name: 'a', email: 'x', message: 'm' }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      code: 'validation_failed',
      message: 'Check the highlighted fields.',
      fields: { email: 'Enter a valid email address.' },
    })
  })

  it('throws a generic ApiError when the error body is not JSON', async () => {
    stubFetch(async () => new Response('<html>bad gateway</html>', { status: 502 }))
    await expect(getFeatured()).rejects.toMatchObject({ status: 502, code: 'unknown_error' })
  })

  it('throws a bad_response ApiError when a successful reply is not JSON', async () => {
    stubFetch(async () => new Response('<html>ok</html>', { status: 200 }))
    const error = await getFeatured().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 200, code: 'bad_response' })
  })

  it('throws ApiError with status 0 when the network fails', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch')
    })
    await expect(getFeatured()).rejects.toMatchObject({ status: 0, code: 'network_error' })
  })

  it('encodes the search term and omits unset paging params', async () => {
    const fn = stubFetch(async () => json({ products: [], page: 1, pageSize: 12, total: 0 }))
    await searchProducts('men & women/shirt')
    expect(fn.mock.calls[0][0]).toBe('/api/products?q=men+%26+women%2Fshirt')
  })

  it('encodes the category path segment', async () => {
    const fn = stubFetch(async () => json({ topRated: [], products: [], page: 1, pageSize: 20, total: 0 }))
    await getCategoryPage("men's clothing")
    expect(fn.mock.calls[0][0]).toBe("/api/categories/men's%20clothing/products")
  })

  it('posts the enquiry as JSON', async () => {
    const fn = stubFetch(async () => json({ status: 'sent' }, 201))
    const payload = { name: 'Ann', email: 'a@b.co', message: 'Hi' }
    await expect(sendEnquiry(payload)).resolves.toBeUndefined()
    const init = fn.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify(payload))
  })
})
