import type { Product, ProductProvider } from '../src/domain/product.ts'

// Fake ProductProvider backed by an in-memory list. Pass `failWith` to make every call reject.
export function fakeProductProvider(products: Product[] = [], failWith?: Error): ProductProvider {
  const run = async <T>(value: () => T): Promise<T> => {
    if (failWith) throw failWith
    return value()
  }
  return {
    list: () => run(() => products),
    getById: (id) => run(() => products.find((p) => p.id === id) ?? null),
    listCategories: () => run(() => [...new Set(products.flatMap((p) => (p.category ? [p.category] : [])))]),
  }
}
