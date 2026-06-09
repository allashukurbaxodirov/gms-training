import postgres from 'postgres'

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined
}

function createSql() {
  return postgres(process.env.DATABASE_URL!, {
    ssl: process.env.DATABASE_SSL === 'true' ? 'require' : false,
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
  })
}

const sql = globalThis.__sql ?? createSql()
if (process.env.NODE_ENV !== 'production') globalThis.__sql = sql

export default sql
