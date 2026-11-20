import { describe, expect, it } from 'vitest'
import { loadConfig } from './config.ts'

const valid = {
  PORT: '3001',
  CLIENT_ORIGIN: 'http://localhost:5173',
  PRODUCT_SOURCE: 'fakestore',
  FAKESTORE_BASE_URL: 'https://fakestoreapi.com',
  FEATURED_PRODUCT_IDS: '1,2,3,4,5',
  MAIL_PROVIDER: 'smtp',
  SMTP_HOST: 'localhost',
  SMTP_PORT: '1025',
  SALES_EMAIL: 'sales@example.com',
}

describe('loadConfig', () => {
  it('parses valid environment into typed values', () => {
    const config = loadConfig(valid)
    expect(config.PORT).toBe(3001)
    expect(config.FEATURED_PRODUCT_IDS).toEqual(['1', '2', '3', '4', '5'])
  })

  it('names every missing variable in the error', () => {
    expect(() => loadConfig({})).toThrow(/PORT[\s\S]*SALES_EMAIL/)
  })

  it('rejects a featured list that is not five ids', () => {
    expect(() => loadConfig({ ...valid, FEATURED_PRODUCT_IDS: '1,2' })).toThrow(/exactly 5/)
  })
})
