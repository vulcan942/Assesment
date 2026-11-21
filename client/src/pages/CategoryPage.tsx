import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Info } from 'lucide-react'
import { ProductGrid } from '@/components/ProductGrid'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ApiError, getCategoryPage, type CategoryPage as CategoryData } from '@/lib/api'
import type { Product } from '@/lib/product'

type State =
  | { status: 'loading' | 'error' | 'not-found' }
  | { status: 'ready'; data: CategoryData }

const h1Class = 'mb-6 text-heading-lg font-bold first-letter:uppercase'
const h2Class = 'mb-4 text-xl leading-7 font-semibold'

// Keyed by category so navigating between categories resets to loading without setState in the effect.
export function CategoryPage() {
  const { category = '' } = useParams()
  return <CategoryContent key={category} category={category} />
}

function CategoryContent({ category }: { category: string }) {
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    getCategoryPage(category).then(
      (data) => !cancelled && setState({ status: 'ready', data }),
      (err: unknown) =>
        !cancelled && setState({ status: err instanceof ApiError && err.status === 404 ? 'not-found' : 'error' }),
    )
    return () => {
      cancelled = true
    }
  }, [category])

  useEffect(() => {
    document.title = `${category} - Catalogue`
    return () => {
      document.title = 'Catalogue'
    }
  }, [category])

  if (state.status === 'not-found') {
    return (
      <>
        <h1 className={h1Class}>Category not found</h1>
        <Alert>
          <Info />
          <AlertDescription>We could not find that category. Choose one from the menu.</AlertDescription>
        </Alert>
      </>
    )
  }

  const onEnquire = (p: Product) => navigate(`/products/${p.id}`)
  const renderTitle = (p: Product) => (
    <Link
      to={`/products/${p.id}`}
      className="flex min-h-11 items-center hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="line-clamp-2">{p.title}</span>
    </Link>
  )

  let body
  if (state.status !== 'ready') {
    body = <ProductGrid products={[]} status={state.status} onEnquire={onEnquire} />
  } else if (state.data.topRated.length === 0 && state.data.products.length === 0) {
    body = (
      <ProductGrid
        products={[]}
        status="ready"
        onEnquire={onEnquire}
        emptyBody="No products in this category yet. Try another category."
      />
    )
  } else {
    const { topRated, products } = state.data
    body = (
      <div className="flex flex-col gap-8 min-[960px]:gap-12">
        {topRated.length > 0 && (
          <section aria-labelledby="top-rated-heading">
            <h2 id="top-rated-heading" className={h2Class}>
              Top rated
            </h2>
            <ProductGrid products={topRated} status="ready" onEnquire={onEnquire} renderTitle={renderTitle} />
          </section>
        )}
        {products.length > 0 && (
          <section aria-labelledby="more-heading">
            <h2 id="more-heading" className={h2Class}>
              More in this category
            </h2>
            <ProductGrid products={products} status="ready" onEnquire={onEnquire} renderTitle={renderTitle} />
          </section>
        )}
      </div>
    )
  }

  return (
    <>
      <h1 className={h1Class}>{category}</h1>
      {body}
    </>
  )
}
