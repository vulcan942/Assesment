import { createApp } from './app.ts'
import { loadConfig } from './config.ts'

let config
try {
  config = loadConfig(process.env)
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}

createApp(config).listen(config.PORT, () => {
  console.info(`Server listening on port ${config.PORT}`)
})
