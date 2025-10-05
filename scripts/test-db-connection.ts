import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getNile } from '../src/db/client';

async function testConnection() {
  console.log('🔍 Testing Nile Database connection...\n');

  try {
    const nile = await getNile();

    // Test 1: Check connection
    console.log('✅ Connection established successfully!\n');

    // Test 2: Count projects
    const projectsResult = await nile.db.query('SELECT COUNT(*) FROM projects');
    console.log(`📦 Projects in database: ${projectsResult.rows[0].count}`);

    // Test 3: Count news
    const newsResult = await nile.db.query('SELECT COUNT(*) FROM news');
    console.log(`📰 News in database: ${newsResult.rows[0].count}`);

    // Test 4: Count categories
    const categoriesResult = await nile.db.query('SELECT COUNT(*) FROM project_categories');
    console.log(`🏷️  Project categories: ${categoriesResult.rows[0].count}`);

    // Test 5: List first 3 projects
    const projects = await nile.db.query('SELECT id, title, status FROM projects LIMIT 3');
    console.log('\n📋 Sample projects:');
    projects.rows.forEach(p => {
      console.log(`   - ${p.title} (${p.status})`);
    });

    console.log('\n✅ All database tests passed!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

testConnection();
