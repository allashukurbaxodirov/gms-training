import postgres from 'postgres'

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined
}

function createSql() {
  const rawUrl = process.env.DATABASE_URL!

  // SSL: explicitly set via env OR auto-detect from connection string
  const useSSL =
    process.env.DATABASE_SSL === 'true' ||
    rawUrl?.includes('sslmode=require') ||
    rawUrl?.includes('neon.tech')

  // postgres npm does not support channel_binding — strip it from URL
  const cleanUrl = rawUrl
    ?.replace(/[?&]channel_binding=[^&]*/g, '')
    .replace(/\?&/, '?')
    .replace(/&&/g, '&')
    .replace(/[?&]$/, '')

  // Serverless-friendly: small pool, short timeouts
  const isServerless = process.env.NODE_ENV === 'production'

  return postgres(cleanUrl, {
    ssl: useSSL ? 'require' : false,
    max: isServerless ? 5 : 20,
    idle_timeout: 20,
    connect_timeout: 15,
  })
}

const sql = globalThis.__sql ?? createSql()
if (process.env.NODE_ENV !== 'production') globalThis.__sql = sql

export default sql
