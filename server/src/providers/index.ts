import type { Config } from '../config.ts'
import type { ProductProvider } from '../domain/product.ts'
import { createFakeStoreProvider } from './fakestore/fakeStoreProvider.ts'

// Composition root for the product source: the only place that knows which adapters exist.
export function createProductProvider(config: Config): ProductProvider {
  switch (config.PRODUCT_SOURCE) {
    case 'fakestore':
      return createFakeStoreProvider(config.FAKESTORE_BASE_URL)
  }
}
