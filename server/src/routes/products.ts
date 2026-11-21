import { Router } from 'express'
import type { CatalogueService } from '../services/catalogue.ts'
import { toCard } from './wire.ts'

export function productsRouter(catalogue: CatalogueService) {
  const router = Router()

  // Registered before any /products/:id route so "featured" is never read as an id.
  router.get('/products/featured', async (_req, res) => {
    const products = await catalogue.getFeatured()
    res.json(products.map(toCard))
  })

  return router
}
