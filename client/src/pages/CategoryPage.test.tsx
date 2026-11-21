import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, getCategories, getCategoryPage, type CategoryPage as CategoryData } from '@/lib/api'
import { routes } from '@/routes'

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  getCategories: vi.fn().mockResolvedValue([]),
  getCategoryPage: vi.fn(),
}))

const mocked = vi.mocked(getCategoryPage)
vi.mocked(getCategories).mockResolvedValue([])

const item = (id: number, title: string) => ({ id, title, price: 10, image: '', category: 'electronics' })
const page = (topRated: CategoryData['topRated'], products: CategoryData['products']): CategoryData => ({
  topRated,
  products,
  page: 1,
  pageSize: 20,
  total: topRated.length + products.length,
})

const renderCategory = () => {
  const router = createMemoryRouter(routes, { initialEntries: ['/categories/electronics'] })
  return render(<RouterProvider router={router} />)
}

describe('CategoryPage', () => {
  it('shows Top rated before More in this category, each with its products', async () => {
    mocked.mockResolvedValue(page([item(1, 'Drive')], [item(2, 'Monitor')]))
    renderCategory()
    const headings = await screen.findAllByRole('heading', { level: 2 })
    expect(headings.map((h) => h.textContent)).toEqual(['Top rated', 'More in this category'])
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('electronics')
    expect(screen.getByRole('link', { name: 'Monitor' })).toHaveAttribute('href', '/products/2')
    expect(mocked).toHaveBeenCalledWith('electronics')
  })

  it('hides the More heading when only top rated products exist', async () => {
    mocked.mockResolvedValue(page([item(1, 'Drive')], []))
    renderCategory()
    expect(await screen.findByRole('heading', { name: 'Top rated' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'More in this category' })).not.toBeInTheDocument()
  })

  it('shows a loading grid without section headings while loading', () => {
    mocked.mockReturnValue(new Promise(() => {}))
    renderCategory()
    expect(screen.getByLabelText('Loading products')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('shows the empty copy when the category has no products', async () => {
    mocked.mockResolvedValue(page([], []))
    renderCategory()
    expect(await screen.findByText('No products in this category yet. Try another category.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('shows the not found notice for an unknown category', async () => {
    mocked.mockRejectedValue(new ApiError(404, 'not_found', 'nope'))
    renderCategory()
    expect(await screen.findByText('Category not found')).toBeInTheDocument()
    expect(screen.getByText('We could not find that category. Choose one from the menu.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Category not found')
  })

  it('sets the document title to the category and resets it on leaving', async () => {
    mocked.mockResolvedValue(page([item(1, 'Drive')], []))
    const { unmount } = renderCategory()
    await screen.findByRole('heading', { name: 'Top rated' })
    expect(document.title).toBe('electronics - Catalogue')
    unmount()
    expect(document.title).toBe('Catalogue')
  })

  it('keeps the category name as typed and relies on CSS to capitalise only the first letter', async () => {
    mocked.mockResolvedValue(page([], []))
    const router = createMemoryRouter(routes, { initialEntries: ["/categories/men's%20clothing"] })
    render(<RouterProvider router={router} />)
    const h1 = await screen.findByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent("men's clothing")
    expect(h1).toHaveClass('first-letter:uppercase')
  })

  it('shows the error notice when the request fails', async () => {
    mocked.mockRejectedValue(new ApiError(500, 'server_error', 'boom'))
    renderCategory()
    expect(await screen.findByRole('alert')).toHaveTextContent('Products did not load')
  })

  it('opens the category page when a nav link is clicked', async () => {
    vi.mocked(getCategories).mockResolvedValue(['electronics', 'jewelery'])
    mocked.mockResolvedValue(page([item(1, 'Drive')], []))
    const router = createMemoryRouter(routes, { initialEntries: ['/categories/electronics'] })
    render(<RouterProvider router={router} />)
    await screen.findByRole('heading', { name: 'Top rated' })
    mocked.mockResolvedValue(page([item(9, 'Ring')], []))
    await userEvent.click(await screen.findByRole('link', { name: 'jewelery' }))
    expect(router.state.location.pathname).toBe('/categories/jewelery')
    expect(await screen.findByRole('link', { name: 'Ring' })).toBeInTheDocument()
    expect(mocked).toHaveBeenLastCalledWith('jewelery')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('jewelery')
    vi.mocked(getCategories).mockResolvedValue([])
  })
})
