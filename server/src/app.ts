import express from 'express'
import type { Config } from './config.ts'
import { healthRouter } from './routes/health.ts'

export function createApp(config: Pick<Config, 'CLIENT_ORIGIN'>) {
  const app = express()
  app.disable('x-powered-by')
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', config.CLIENT_ORIGIN)
    res.setHeader('Vary', 'Origin')
    next()
  })
  app.use('/api', healthRouter)
  return app
}
