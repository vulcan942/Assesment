import { NotFoundError } from '../domain/errors.ts'
import type { Product, ProductProvider } from '../domain/product.ts'

const TOP_RATED_COUNT = 3

export interface CatalogueService {
  getFeatured(): Promise<Product[]>
  listCategories(): Promise<string[]>
  getCategoryPage(category: string): Promise<{ topRated: Product[]; products: Product[] }>
  search(term: string): Promise<Product[]>
  getProduct(id: string): Promise<Product>
}

// Rating descending, unrated last, ties by id (numeric-aware so "2" sorts before "10").
function byRanking(a: Product, b: Product): number {
  const diff = (b.rating ?? -Infinity) - (a.rating ?? -Infinity)
  if (diff !== 0 && !Number.isNaN(diff)) return diff
  return a.id.localeCompare(b.id, undefined, { numeric: true })
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

    listCategories: () => deps.provider.listCategories(),

    // Literal substring match (no regex) so characters like "(" or ".*" are safe. Provider order, no ranking.
    async search(term) {
      const needle = term.toLowerCase()
      return (await deps.provider.list()).filter(
        (p) => p.title.toLowerCase().includes(needle) || (p.description ?? '').toLowerCase().includes(needle),
      )
    },

    async getProduct(id) {
      const product = await deps.provider.getById(id)
      if (!product) throw new NotFoundError(`Unknown product "${id}"`)
      return product
    },

    async getCategoryPage(category) {
      const categories = await deps.provider.listCategories()
      if (!categories.includes(category)) throw new NotFoundError(`Unknown category "${category}"`)
      const sorted = (await deps.provider.list()).filter((p) => p.category === category).sort(byRanking)
      return { topRated: sorted.slice(0, TOP_RATED_COUNT), products: sorted.slice(TOP_RATED_COUNT) }
    },
  }
}
