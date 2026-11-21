import express from 'express'
import type { Config } from './config.ts'
import type { CatalogueService } from './services/catalogue.ts'
import { categoriesRouter } from './routes/categories.ts'
import { errorHandler } from './routes/errorHandler.ts'
import { healthRouter } from './routes/health.ts'
import { productsRouter } from './routes/products.ts'

export function createApp(config: Pick<Config, 'CLIENT_ORIGIN'>, services: { catalogue: CatalogueService }) {
  const app = express()
  app.disable('x-powered-by')
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', config.CLIENT_ORIGIN)
    res.setHeader('Vary', 'Origin')
    next()
  })
  app.use('/api', healthRouter)
  app.use('/api', productsRouter(services.catalogue))
  app.use('/api', categoriesRouter(services.catalogue))
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'not_found', message: 'We could not find that page.' } })
  })
  app.use(errorHandler)
  return app
}
