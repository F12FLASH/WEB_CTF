// test-connection.js
import pkg from 'pg';
const { Client } = pkg;

async function testConnection() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_U1ySBcv2eGqr@ep-square-silence-ad2mp4tq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Database connection successful');
    
    const result = await client.query('SELECT version()');
    console.log('📋 PostgreSQL version:', result.rows[0].version.split(',')[0]);
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();