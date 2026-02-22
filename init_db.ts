import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  lead_name VARCHAR(255) NOT NULL,
  pincode VARCHAR(20),
  advisor_name VARCHAR(255),
  members JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

const initDb = async () => {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected. Creating table...');
    await client.query(createTableQuery);
    console.log('Table "leads" created or already exists.');
    client.release();
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await pool.end();
  }
};

initDb();
