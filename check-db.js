// check-db-fixed.js - Dùng node-postgres thay vì serverless
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_U1ySBcv2eGqr@ep-square-silence-ad2mp4tq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkDatabase() {
  try {
    console.log('🔍 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');
    
    // Kiểm tra tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📊 Tables found:', tablesResult.rows.length);
    tablesResult.rows.forEach(t => console.log('   -', t.table_name));
    
    // Kiểm tra từng table quan trọng
    for (const table of tablesResult.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
        console.log(`   📝 ${table.table_name}: ${countResult.rows[0].count} rows`);
      } catch (e) {
        console.log(`   📝 ${table.table_name}: (cannot count)`);
      }
    }
    
    await client.end();
    console.log('✅ Check completed');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    if (client) await client.end();
  }
}

checkDatabase();