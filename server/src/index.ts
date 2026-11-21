import { createApp } from './app.ts'
import { loadConfig } from './config.ts'
import { createProductProvider } from './providers/index.ts'
import { createCatalogueService } from './services/catalogue.ts'

let config
try {
  config = loadConfig(process.env)
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}

const catalogue = createCatalogueService({
  provider: createProductProvider(config),
  featuredIds: config.FEATURED_PRODUCT_IDS,
})

createApp(config, { catalogue }).listen(config.PORT, () => {
  console.info(`Server listening on port ${config.PORT}`)
})
