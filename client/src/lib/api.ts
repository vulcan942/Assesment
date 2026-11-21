import type { SubmitEnquiry } from './enquiry'
import type { Product } from './product'

const BASE_URL = '/api'

export interface ProductDetail extends Product {
  description?: string
}

export interface ProductPage {
  products: Product[]
  page: number
  pageSize: number
  total: number
}

export interface CategoryPage extends ProductPage {
  topRated: Product[]
}

export interface PageParams {
  page?: number
  pageSize?: number
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields?: Record<string, string>

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }
}

interface ErrorBody {
  error?: { code?: string; message?: string; fields?: Record<string, string> }
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: ErrorBody = {}
  try {
    body = (await response.json()) as ErrorBody
  } catch {
    // Non-JSON error body (proxy page, empty 502): fall through to the generic message.
  }
  const { code, message, fields } = body.error ?? {}
  return new ApiError(
    response.status,
    code ?? 'unknown_error',
    message ?? 'Something went wrong. Try again.',
    fields,
  )
}

async function request<T>(path: string, params?: Record<string, string | number | undefined>, init?: RequestInit): Promise<T> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) query.set(key, String(value))
  }
  const qs = query.size > 0 ? `?${query}` : ''

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}${qs}`, init)
  } catch {
    throw new ApiError(0, 'network_error', 'We could not reach the server. Check your connection and try again.')
  }
  if (!response.ok) throw await toApiError(response)
  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError(response.status, 'bad_response', 'The server sent a reply we could not read. Try again in a moment.')
  }
}

const segment = encodeURIComponent

export const getFeatured = () => request<Product[]>('/products/featured')

export const getCategories = () => request<string[]>('/categories')

export const getCategoryProducts = (category: string, { page, pageSize }: PageParams = {}) =>
  request<CategoryPage>(`/categories/${segment(category)}/products`, { page, pageSize })

export const searchProducts = (q: string, { page, pageSize }: PageParams = {}) =>
  request<ProductPage>('/products', { q, page, pageSize })

export const getProduct = (id: string | number) => request<ProductDetail>(`/products/${segment(String(id))}`)

// Resolves on 201, rejects with ApiError otherwise, so the form shows its failure notice.
export const sendEnquiry: SubmitEnquiry = async (payload) => {
  await request<{ status: 'sent' }>('/enquiries', undefined, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
