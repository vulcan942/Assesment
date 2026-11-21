import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AlertCircle, Info } from 'lucide-react'
import { ProductGrid } from '@/components/ProductGrid'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ApiError, searchProducts } from '@/lib/api'
import type { Product } from '@/lib/product'

type State =
  | { status: 'loading' | 'error' }
  | { status: 'invalid'; message: string }
  | { status: 'ready'; products: Product[] }

const h1Class = 'mb-6 text-heading-lg font-bold'

// Keyed by term so a new search resets to loading without setState in the effect.
export function SearchPage() {
  const [params] = useSearchParams()
  const term = (params.get('q') ?? '').trim()

  useEffect(() => {
    document.title = 'Search - Catalogue'
    return () => {
      document.title = 'Catalogue'
    }
  }, [])

  if (!term) {
    return (
      <>
        <h1 className={h1Class}>Search products</h1>
        <Alert>
          <Info />
          <AlertTitle>No search term</AlertTitle>
          <AlertDescription>Enter a word to search for.</AlertDescription>
        </Alert>
      </>
    )
  }
  return <SearchResults key={term} term={term} />
}

function SearchResults({ term }: { term: string }) {
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    searchProducts(term).then(
      ({ products }) => !cancelled && setState({ status: 'ready', products }),
      (err: unknown) => {
        if (cancelled) return
        const message = err instanceof ApiError && err.status === 400 ? err.fields?.q : undefined
        setState(message ? { status: 'invalid', message } : { status: 'error' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [term])

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
  if (state.status === 'invalid') {
    body = (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Search did not run</AlertTitle>
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    )
  } else if (state.status !== 'ready') {
    body = <ProductGrid products={[]} status={state.status} onEnquire={onEnquire} />
  } else if (state.products.length === 0) {
    body = (
      <ProductGrid
        products={[]}
        status="ready"
        onEnquire={onEnquire}
        emptyTitle={`No products match "${term}"`}
        emptyBody="Try a different word or browse a category."
      />
    )
  } else {
    body = (
      <>
        <h2 className="sr-only">Matching products</h2>
        <ProductGrid products={state.products} status="ready" onEnquire={onEnquire} renderTitle={renderTitle} />
      </>
    )
  }

  return (
    <div className="[overflow-wrap:anywhere]">
      <h1 className={h1Class}>Results for &quot;{term}&quot;</h1>
      {body}
    </div>
  )
}
