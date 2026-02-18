import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '~/db/schema/index'

const defaultDatabaseUrl =
  'postgresql://postgres:postgres@localhost:5432/fullstack_forge_commerce_dev'
const databaseUrl = process.env.DATABASE_URL?.trim() || defaultDatabaseUrl

export const pool = new Pool({
  connectionString: databaseUrl,
})

export const db = drizzle({ client: pool, schema })
