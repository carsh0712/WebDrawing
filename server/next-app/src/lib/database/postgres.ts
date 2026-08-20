import { Pool } from 'pg';
import { getDatabaseUrl } from '@/lib/runtime/environment';

let pool: Pool | null = null;

export const getPostgresPool = () => {
  if (pool) {
    return pool;
  }

  const connectionString = getDatabaseUrl();

  if (!connectionString) {
    throw new Error('DATABASE_URL is required when DATABASE_PROVIDER=docker-postgres.');
  }

  pool = new Pool({ connectionString });
  return pool;
};
