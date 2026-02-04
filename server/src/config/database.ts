import knex from 'knex';
import * as dotenv from 'dotenv';

dotenv.config();

export const db = knex({
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'itson_fsm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  pool: {
    min: 2,
    max: 10,
  },
  debug: process.env.NODE_ENV === 'development',
});

// Test connection
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Database connection pool created');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });

export default db;
