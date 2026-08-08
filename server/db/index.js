import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || '';
const isPlaceholder = !connectionString || connectionString.includes('ep-placeholder') || connectionString.includes('user:password');

let dbInstance = null;

if (!isPlaceholder) {
  try {
    const sql = neon(connectionString);
    dbInstance = drizzle(sql, { schema });
    console.log('Successfully connected to Neon PostgreSQL via Drizzle ORM');
  } catch (err) {
    console.warn('Neon DB connection error, falling back to local storage:', err.message);
  }
} else {
  console.log('Notice: DATABASE_URL in .env is using a placeholder. Add your actual Neon URL to persist to Neon PostgreSQL cloud!');
}

export const db = dbInstance;
export const isUsingNeon = !!dbInstance;
