import type { Product, ProductProvider } from '../domain/product.ts'

export interface CatalogueService {
  getFeatured(): Promise<Product[]>
}

export function createCatalogueService(deps: { provider: ProductProvider; featuredIds: string[] }): CatalogueService {
  return {
    async getFeatured() {
      const found = await Promise.all(deps.featuredIds.map((id) => deps.provider.getById(id)))
      const featured: Product[] = []
      found.forEach((product, i) => {
        if (product) featured.push(product)
        else console.warn(`Featured product ${deps.featuredIds[i]} not found, skipping`)
      })
      return featured
    },
  }
}
