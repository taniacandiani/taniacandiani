import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';

// Load environment variables FIRST
dotenv.config({ path: '.env.local' });

import { getNile } from '../src/db/client';

async function migrateData() {
  const nile = await getNile();

  try {
    console.log('Starting data migration from JSON to Nile Database...\n');

    // 1. Migrate Projects
    console.log('📦 Migrating projects...');
    const projectsData = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'src/data/projects.json'), 'utf-8')
    );

    for (const project of projectsData) {
      await nile.db.query(
        `INSERT INTO projects (
          id, title, subtitle, image, year, description, slug, categories, tags,
          featured, status, hero_images, show_in_home_hero, hero_description,
          project_details, technical_sheet, download_link, additional_image,
          commissioned_by, curator, location,
          title_en, subtitle_en, description_en, project_details_en,
          technical_sheet_en, hero_description_en, commissioned_by_en,
          curator_en, location_en
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb,
          $10, $11, $12::jsonb, $13, $14,
          $15, $16, $17, $18,
          $19, $20, $21,
          $22, $23, $24, $25,
          $26, $27, $28,
          $29, $30
        ) ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          subtitle = EXCLUDED.subtitle,
          image = EXCLUDED.image,
          year = EXCLUDED.year,
          description = EXCLUDED.description,
          categories = EXCLUDED.categories,
          updated_at = NOW()
        `,
        [
          project.id,
          project.title,
          project.subtitle || null,
          project.image,
          project.year,
          project.description,
          project.slug,
          JSON.stringify(project.categories || []),
          JSON.stringify(project.tags || []),
          project.featured || false,
          project.status || 'published',
          JSON.stringify(project.heroImages || []),
          project.showInHomeHero || false,
          project.heroDescription || null,
          project.projectDetails || null,
          project.technicalSheet || null,
          project.downloadLink || null,
          project.additionalImage || null,
          project.commissionedBy || null,
          project.curator || null,
          project.location || null,
          project.title_en || null,
          project.subtitle_en || null,
          project.description_en || null,
          project.projectDetails_en || null,
          project.technicalSheet_en || null,
          project.heroDescription_en || null,
          project.commissionedBy_en || null,
          project.curator_en || null,
          project.location_en || null,
        ]
      );
    }
    console.log(`✓ Migrated ${projectsData.length} projects`);

    // 2. Migrate News
    console.log('\n📰 Migrating news...');
    const newsData = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'src/data/news.json'), 'utf-8')
    );

    for (const newsItem of newsData) {
      await nile.db.query(
        `INSERT INTO news (
          id, title, content, image, slug, published_at, categories,
          author, status, tags, hero_images
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10::jsonb, $11::jsonb
        ) ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          updated_at = NOW()
        `,
        [
          newsItem.id,
          newsItem.title,
          newsItem.content,
          newsItem.image,
          newsItem.slug,
          newsItem.publishedAt,
          JSON.stringify(newsItem.categories || []),
          newsItem.author || null,
          newsItem.status || 'published',
          JSON.stringify(newsItem.tags || []),
          JSON.stringify(newsItem.heroImages || []),
        ]
      );
    }
    console.log(`✓ Migrated ${newsData.length} news items`);

    // 3. Migrate Project Categories
    console.log('\n🏷️  Migrating project categories...');
    const projectCategoriesData = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'src/data/categories.json'), 'utf-8')
    );

    for (const category of projectCategoriesData) {
      await nile.db.query(
        `INSERT INTO project_categories (id, name, count, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          count = EXCLUDED.count
        `,
        [category.id, category.name, category.count || 0, category.createdAt]
      );
    }
    console.log(`✓ Migrated ${projectCategoriesData.length} project categories`);

    // 4. Migrate News Categories
    console.log('\n🏷️  Migrating news categories...');
    const newsCategoriesData = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'src/data/news-categories.json'), 'utf-8')
    );

    for (const category of newsCategoriesData) {
      await nile.db.query(
        `INSERT INTO news_categories (id, name, count, created_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          count = EXCLUDED.count
        `,
        [category.id, category.name, category.count || 0, category.createdAt]
      );
    }
    console.log(`✓ Migrated ${newsCategoriesData.length} news categories`);

    // 5. Migrate Publications
    console.log('\n📚 Migrating publications...');
    const publicationsData = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'src/data/publications.json'), 'utf-8')
    );

    for (const publication of publicationsData) {
      await nile.db.query(
        `INSERT INTO publications (
          id, title, description, thumbnail, download_link, published_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          updated_at = NOW()
        `,
        [
          publication.id,
          publication.title,
          publication.description || null,
          publication.thumbnail || null,
          publication.downloadLink || null,
          publication.publishedAt,
          publication.status || 'published',
        ]
      );
    }
    console.log(`✓ Migrated ${publicationsData.length} publications`);

    // 6. Migrate About Content
    console.log('\n📄 Migrating about content...');
    const aboutData = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'src/data/about.json'), 'utf-8')
    );

    await nile.db.query(
      `INSERT INTO about_content (id, title, content, last_updated)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        last_updated = EXCLUDED.last_updated
      `,
      [aboutData.id, aboutData.title, aboutData.content, aboutData.lastUpdated]
    );
    console.log('✓ Migrated about content');

    // 7. Migrate Contact Content
    console.log('\n📧 Migrating contact content...');
    const contactData = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'src/data/contact.json'), 'utf-8')
    );

    await nile.db.query(
      `INSERT INTO contact_content (id, title, description, last_updated)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        last_updated = EXCLUDED.last_updated
      `,
      [contactData.id, contactData.title, contactData.description, contactData.lastUpdated]
    );
    console.log('✓ Migrated contact content');

    console.log('\n✅ All data migrated successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${projectsData.length} projects`);
    console.log(`   - ${newsData.length} news items`);
    console.log(`   - ${projectCategoriesData.length} project categories`);
    console.log(`   - ${newsCategoriesData.length} news categories`);
    console.log(`   - ${publicationsData.length} publications`);
    console.log('   - 1 about content');
    console.log('   - 1 contact content');

  } catch (error) {
    console.error('❌ Error migrating data:', error);
    throw error;
  }
}

migrateData();
