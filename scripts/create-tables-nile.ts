import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

import { getNile } from '../src/db/client';

async function createTables() {
  const nile = await getNile();

  try {
    console.log('Creating tables in Nile...');

    // Create projects table
    await nile.db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        subtitle VARCHAR(500),
        image TEXT,
        year INTEGER,
        description TEXT,
        slug VARCHAR(255) NOT NULL UNIQUE,
        categories JSONB,
        tags JSONB,
        featured BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'draft',
        hero_images JSONB,
        show_in_home_hero BOOLEAN DEFAULT false,
        hero_description TEXT,
        project_details TEXT,
        technical_sheet TEXT,
        download_link TEXT,
        additional_image TEXT,
        commissioned_by VARCHAR(255),
        curator VARCHAR(255),
        location VARCHAR(255),
        title_en VARCHAR(500),
        subtitle_en VARCHAR(500),
        description_en TEXT,
        project_details_en TEXT,
        technical_sheet_en TEXT,
        hero_description_en TEXT,
        commissioned_by_en VARCHAR(255),
        curator_en VARCHAR(255),
        location_en VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Projects table created');

    // Create news table
    await nile.db.query(`
      CREATE TABLE IF NOT EXISTS news (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        image TEXT,
        slug VARCHAR(255) NOT NULL UNIQUE,
        published_at TIMESTAMP,
        categories JSONB,
        author VARCHAR(255),
        status VARCHAR(50) DEFAULT 'draft',
        tags JSONB,
        hero_images JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ News table created');

    // Create project_categories table
    await nile.db.query(`
      CREATE TABLE IF NOT EXISTS project_categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Project categories table created');

    // Create news_categories table
    await nile.db.query(`
      CREATE TABLE IF NOT EXISTS news_categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ News categories table created');

    // Create publications table
    await nile.db.query(`
      CREATE TABLE IF NOT EXISTS publications (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        thumbnail TEXT,
        download_link TEXT,
        published_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Publications table created');

    // Create about_content table
    await nile.db.query(`
      CREATE TABLE IF NOT EXISTS about_content (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500),
        content TEXT,
        last_updated TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ About content table created');

    // Create contact_content table
    await nile.db.query(`
      CREATE TABLE IF NOT EXISTS contact_content (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500),
        description TEXT,
        last_updated TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Contact content table created');

    console.log('\n✅ All tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

createTables();
