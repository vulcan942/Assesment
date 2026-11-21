import { Router } from 'express'
import { z } from 'zod'
import { ValidationError } from '../domain/errors.ts'
import type { CatalogueService } from '../services/catalogue.ts'
import { toCard } from './wire.ts'

const categorySchema = z.string().trim().min(1).max(64)

export function categoriesRouter(catalogue: CatalogueService) {
  const router = Router()

  router.get('/categories', async (_req, res) => {
    res.json(await catalogue.listCategories())
  })

  router.get('/categories/:category/products', async (req, res) => {
    const parsed = categorySchema.safeParse(req.params.category)
    if (!parsed.success) throw new ValidationError({ category: 'Enter a category name of 1 to 64 characters.' })
    const { topRated, products } = await catalogue.getCategoryPage(parsed.data)
    res.json({
      topRated: topRated.map(toCard),
      products: products.map(toCard),
      page: 1,
      pageSize: products.length,
      total: products.length,
    })
  })

  return router
}
