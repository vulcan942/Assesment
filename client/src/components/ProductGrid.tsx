import { AlertCircle, Info } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import type { Product } from '@/lib/product'

interface ProductGridProps {
  products: Product[]
  status: 'loading' | 'error' | 'ready'
  currency?: string
  onEnquire: (product: Product) => void
}

const gridClass = 'grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6'

export function ProductGrid({ products, status, currency, onEnquire }: ProductGridProps) {
  if (status === 'loading') {
    return (
      <div className={gridClass} aria-busy="true" aria-label="Loading products">
        {Array.from({ length: 8 }, (_, i) => (
          <Card key={i} className="gap-0 py-0" aria-hidden="true">
            <div className="aspect-square bg-muted" />
            <div className="flex flex-col gap-2 p-4">
              <div className="h-4 w-1/3 rounded-sm bg-muted" />
              <div className="h-6 w-full rounded-sm bg-muted" />
              <div className="h-11 w-full rounded-md bg-muted" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Products did not load</AlertTitle>
        <AlertDescription>Check your connection and refresh the page to try again.</AlertDescription>
      </Alert>
    )
  }

  if (products.length === 0) {
    return (
      <Alert>
        <Info />
        <AlertTitle>No products found</AlertTitle>
        <AlertDescription>Choose another category to see more products.</AlertDescription>
      </Alert>
    )
  }

  return (
    <ul className={gridClass}>
      {products.map((product) => (
        <li key={product.id} className="flex">
          <ProductCard product={product} currency={currency} onEnquire={onEnquire} />
        </li>
      ))}
    </ul>
  )
}
