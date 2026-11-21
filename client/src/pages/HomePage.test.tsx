import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, getFeatured } from '@/lib/api'
import { routes } from '@/routes'

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  getFeatured: vi.fn(),
}))

const mockedGetFeatured = vi.mocked(getFeatured)
const products = [
  { id: 1, title: 'Backpack', price: 109.95, image: '', category: "men's clothing" },
  { id: 7, title: 'Hard drive', price: 64, image: '', category: 'electronics' },
]

const renderHome = () => {
  const router = createMemoryRouter(routes, { initialEntries: ['/'] })
  render(<RouterProvider router={router} />)
  return router
}

describe('HomePage', () => {
  it('shows one card per featured product with the title linking to its page', async () => {
    mockedGetFeatured.mockResolvedValue(products)
    renderHome()
    expect(await screen.findByRole('link', { name: 'Backpack' })).toHaveAttribute('href', '/products/1')
    expect(screen.getByRole('link', { name: 'Hard drive' })).toHaveAttribute('href', '/products/7')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('shows the loading placeholders while featured products load', () => {
    mockedGetFeatured.mockReturnValue(new Promise(() => {}))
    renderHome()
    expect(screen.getByLabelText('Loading products')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('heading', { name: 'Featured products' })).toBeInTheDocument()
  })

  it('shows the error notice when the request fails', async () => {
    mockedGetFeatured.mockRejectedValue(new ApiError(0, 'network_error', 'down'))
    renderHome()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Featured products did not load')
    expect(alert).toHaveTextContent('refresh the page')
  })

  it('shows the empty copy when there are no featured products', async () => {
    mockedGetFeatured.mockResolvedValue([])
    renderHome()
    expect(await screen.findByText('No featured products')).toBeInTheDocument()
    expect(screen.getByText('No featured products right now. Try browsing a category.')).toBeInTheDocument()
  })

  it('opens the product route when Enquire is pressed', async () => {
    mockedGetFeatured.mockResolvedValue(products)
    const router = renderHome()
    await userEvent.click(await screen.findByRole('button', { name: /about Hard drive/ }))
    expect(router.state.location.pathname).toBe('/products/7')
  })
})
