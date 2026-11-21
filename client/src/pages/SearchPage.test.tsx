import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, getCategories, searchProducts, type ProductPage } from '@/lib/api'
import { routes } from '@/routes'

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  getCategories: vi.fn().mockResolvedValue([]),
  searchProducts: vi.fn(),
}))

const mocked = vi.mocked(searchProducts)
vi.mocked(getCategories).mockResolvedValue([])

const item = (id: number, title: string) => ({ id, title, price: 10, image: '', category: 'electronics' })
const page = (products: ProductPage['products']): ProductPage => ({
  products,
  page: 1,
  pageSize: 12,
  total: products.length,
})

const renderAt = (url: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [url] })
  return render(<RouterProvider router={router} />)
}

const searchbox = () => screen.getByRole('searchbox', { name: 'Search products' })

describe('SearchPage', () => {
  it('lists matching products linked to their pages', async () => {
    mocked.mockResolvedValue(page([item(7, 'Blue shirt')]))
    renderAt('/search?q=shirt')
    expect(await screen.findByRole('link', { name: 'Blue shirt' })).toHaveAttribute('href', '/products/7')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Results for "shirt"')
    expect(screen.getByRole('heading', { level: 2, name: 'Matching products' })).toBeInTheDocument()
    expect(mocked).toHaveBeenCalledWith('shirt')
  })

  it('shows the current term in the header search field', async () => {
    mocked.mockResolvedValue(page([]))
    renderAt('/search?q=shirt')
    expect(searchbox()).toHaveValue('shirt')
    await screen.findByText('Try a different word or browse a category.')
  })

  it('leaves the header search field blank on other pages', () => {
    renderAt('/')
    expect(searchbox()).toHaveValue('')
  })

  it('says nothing matched, with the term', async () => {
    mocked.mockResolvedValue(page([]))
    renderAt('/search?q=zzz')
    expect(await screen.findByText('No products match "zzz"')).toBeInTheDocument()
    expect(screen.getByText('Try a different word or browse a category.')).toBeInTheDocument()
  })

  it('asks for a term and sends no request when q is missing', () => {
    mocked.mockClear()
    renderAt('/search')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Search products')
    expect(screen.getByText('No search term')).toBeInTheDocument()
    expect(mocked).not.toHaveBeenCalled()
  })

  it('shows the server message when the term is rejected', async () => {
    mocked.mockRejectedValue(new ApiError(400, 'validation_error', 'Invalid', { q: 'Use 100 characters or fewer.' }))
    renderAt('/search?q=x')
    expect(await screen.findByText('Use 100 characters or fewer.')).toBeInTheDocument()
  })

  it('shows a loading grid while the request is pending', () => {
    mocked.mockReturnValue(new Promise(() => {}))
    renderAt('/search?q=shirt')
    expect(screen.getByLabelText('Loading products')).toHaveAttribute('aria-busy', 'true')
  })

  it('shows the connection error when the request fails', async () => {
    mocked.mockRejectedValue(new ApiError(0, 'network_error', 'down'))
    renderAt('/search?q=shirt')
    expect(await screen.findByText('Products did not load')).toBeInTheDocument()
  })

  it('sets the document title and restores it on leave', () => {
    mocked.mockReturnValue(new Promise(() => {}))
    const { unmount } = renderAt('/search?q=shirt')
    expect(document.title).toBe('Search - Catalogue')
    unmount()
    expect(document.title).toBe('Catalogue')
  })

  it.each([
    ['home', '/'],
    ['category', '/categories/electronics'],
    ['not-found', '/nowhere'],
  ])('shows the search bar on the %s route', (_name, url) => {
    renderAt(url)
    expect(searchbox()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
  })

  it('goes from a non-search page to results showing the term', async () => {
    mocked.mockResolvedValue(page([item(7, 'Blue shirt')]))
    renderAt('/nowhere')
    await userEvent.type(searchbox(), 'shirt')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Results for "shirt"' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Blue shirt' })).toBeInTheDocument()
    expect(mocked).toHaveBeenLastCalledWith('shirt')
  })

  it('searches again from the header and shows the new term', async () => {
    mocked.mockResolvedValue(page([]))
    renderAt('/search?q=shirt')
    await userEvent.clear(searchbox())
    await userEvent.type(searchbox(), 'lamp{Enter}')
    expect(await screen.findByRole('heading', { level: 1, name: 'Results for "lamp"' })).toBeInTheDocument()
    expect(mocked).toHaveBeenLastCalledWith('lamp')
  })
})
