// import-data.js
import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_U1ySBcv2eGqr@ep-square-silence-ad2mp4tq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

// Đọc file JSON
const data = JSON.parse(fs.readFileSync('./ctf-data.json', 'utf8'));

async function importData() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Import categories
    console.log('📥 Importing categories...');
    for (const category of data.data.categories) {
      await client.query(`
        INSERT INTO categories (id, name, slug, description, color, icon, "sortOrder", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [category.id, category.name, category.slug, category.description, category.color, category.icon, category.sortOrder, category.createdAt]);
    }

    // Import difficulties
    console.log('📥 Importing difficulties...');
    for (const difficulty of data.data.difficulties) {
      await client.query(`
        INSERT INTO difficulties (id, name, slug, description, color, level, "sortOrder", "pointsMultiplier", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [difficulty.id, difficulty.name, difficulty.slug, difficulty.description, difficulty.color, difficulty.level, difficulty.sortOrder, difficulty.pointsMultiplier, difficulty.createdAt]);
    }

    // Import challenges
    console.log('📥 Importing challenges...');
    for (const challenge of data.data.challenges) {
      await client.query(`
        INSERT INTO challenges (id, title, description, "categoryId", "difficultyId", points, flag)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [challenge.id, challenge.title, challenge.description, challenge.categoryId, challenge.difficultyId, challenge.points, challenge.flag]);
    }

    // Import players
    console.log('📥 Importing players...');
    for (const player of data.data.players) {
      await client.query(`
        INSERT INTO players (id, username, email, "passwordHash", score, "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [player.id, player.username, player.email, player.passwordHash, player.score, player.createdAt]);
    }

    // Import submissions
    console.log('📥 Importing submissions...');
    for (const submission of data.data.submissions) {
      await client.query(`
        INSERT INTO submissions (id, "playerId", "challengeId", "submittedFlag", "isCorrect", timestamp)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [submission.id, submission.playerId, submission.challengeId, submission.submittedFlag, submission.isCorrect, submission.timestamp]);
    }

    // Import announcements
    console.log('📥 Importing announcements...');
    for (const announcement of data.data.announcements) {
      await client.query(`
        INSERT INTO announcements (id, title, message, type, "isActive", "createdAt", "createdBy")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [announcement.id, announcement.title, announcement.message, announcement.type, announcement.isActive, announcement.createdAt, announcement.createdBy]);
    }

    // Import settings
    console.log('📥 Importing settings...');
    for (const setting of data.data.settings) {
      await client.query(`
        INSERT INTO settings (id, key, value, "updatedAt")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
      `, [setting.id, setting.key, setting.value, setting.updatedAt]);
    }

    console.log('🎉 All data imported successfully!');
    
    // Hiển thị thống kê
    const categoriesCount = await client.query('SELECT COUNT(*) FROM categories');
    const challengesCount = await client.query('SELECT COUNT(*) FROM challenges');
    const playersCount = await client.query('SELECT COUNT(*) FROM players');
    const submissionsCount = await client.query('SELECT COUNT(*) FROM submissions');
    
    console.log('\n📊 Import Statistics:');
    console.log(`   Categories: ${categoriesCount.rows[0].count}`);
    console.log(`   Challenges: ${challengesCount.rows[0].count}`);
    console.log(`   Players: ${playersCount.rows[0].count}`);
    console.log(`   Submissions: ${submissionsCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Import error:', error);
  } finally {
    await client.end();
  }
}

importData();