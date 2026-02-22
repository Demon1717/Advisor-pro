import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a new pool using connection string or environment variables
// Expected env vars: DATABASE_URL or PGUSER, PGHOST, PGPASSWORD, PGDATABASE, PGPORT
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
