import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

import { v2 as cloudinary } from 'cloudinary';
import { getNile } from '../src/db/client';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface ImageMigration {
  oldPath: string;
  newUrl: string;
  projectId?: string;
  newsId?: string;
  type: 'project' | 'news' | 'publication';
}

async function migrateImages() {
  console.log('🚀 Starting image migration to Cloudinary...\n');

  const nile = await getNile();
  const migrations: ImageMigration[] = [];

  try {
    // 1. Get all projects with local images
    console.log('📦 Migrating project images...');
    const projects = await nile.db.query('SELECT * FROM projects');

    for (const project of projects.rows) {
      const imagesToMigrate: string[] = [];

      // Check main image
      if (project.image && project.image.startsWith('/uploads/')) {
        imagesToMigrate.push(project.image);
      }

      // Check hero images
      if (project.hero_images && Array.isArray(project.hero_images)) {
        project.hero_images.forEach((img: string) => {
          if (img.startsWith('/uploads/')) {
            imagesToMigrate.push(img);
          }
        });
      }

      // Check additional image
      if (project.additional_image && project.additional_image.startsWith('/uploads/')) {
        imagesToMigrate.push(project.additional_image);
      }

      if (imagesToMigrate.length === 0) {
        console.log(`  ⏭️  Project "${project.title}": No local images to migrate`);
        continue;
      }

      console.log(`  🔄 Project "${project.title}": Migrating ${imagesToMigrate.length} image(s)...`);

      for (const imagePath of imagesToMigrate) {
        try {
          const localPath = path.join(process.cwd(), 'public', imagePath);

          // Check if file exists
          try {
            await fs.access(localPath);
          } catch {
            console.log(`    ⚠️  File not found: ${imagePath}`);
            continue;
          }

          // Read file
          const imageBuffer = await fs.readFile(localPath);
          const base64Image = `data:image/${path.extname(imagePath).slice(1)};base64,${imageBuffer.toString('base64')}`;

          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'proyectos',
            resource_type: 'image',
          });
          console.log(`    ✅ Uploaded: ${imagePath} → ${result.secure_url}`);

          migrations.push({
            oldPath: imagePath,
            newUrl: result.secure_url,
            projectId: project.id,
            type: 'project',
          });

          // Update project in database
          let updatedHeroImages = project.hero_images;
          if (updatedHeroImages && Array.isArray(updatedHeroImages)) {
            updatedHeroImages = updatedHeroImages.map((img: string) =>
              img === imagePath ? result.secure_url : img
            );
          }

          await nile.db.query(
            `UPDATE projects SET
              image = CASE WHEN image = $2 THEN $3 ELSE image END,
              hero_images = $4,
              additional_image = CASE WHEN additional_image = $2 THEN $3 ELSE additional_image END,
              updated_at = NOW()
            WHERE id = $1`,
            [
              project.id,
              imagePath,
              result.secure_url,
              JSON.stringify(updatedHeroImages),
            ]
          );

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`    ❌ Failed to migrate ${imagePath}:`, error);
        }
      }
    }

    // 2. Migrate news images
    console.log('\n📰 Migrating news images...');
    const news = await nile.db.query('SELECT * FROM news');

    for (const newsItem of news.rows) {
      const imagesToMigrate: string[] = [];

      if (newsItem.image && newsItem.image.startsWith('/uploads/')) {
        imagesToMigrate.push(newsItem.image);
      }

      if (newsItem.hero_images && Array.isArray(newsItem.hero_images)) {
        newsItem.hero_images.forEach((img: string) => {
          if (img.startsWith('/uploads/')) {
            imagesToMigrate.push(img);
          }
        });
      }

      if (imagesToMigrate.length === 0) {
        console.log(`  ⏭️  News "${newsItem.title}": No local images to migrate`);
        continue;
      }

      console.log(`  🔄 News "${newsItem.title}": Migrating ${imagesToMigrate.length} image(s)...`);

      for (const imagePath of imagesToMigrate) {
        try {
          const localPath = path.join(process.cwd(), 'public', imagePath);

          try {
            await fs.access(localPath);
          } catch {
            console.log(`    ⚠️  File not found: ${imagePath}`);
            continue;
          }

          const imageBuffer = await fs.readFile(localPath);
          const base64Image = `data:image/${path.extname(imagePath).slice(1)};base64,${imageBuffer.toString('base64')}`;

          const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'noticias',
            resource_type: 'image',
          });
          console.log(`    ✅ Uploaded: ${imagePath} → ${result.secure_url}`);

          migrations.push({
            oldPath: imagePath,
            newUrl: result.secure_url,
            newsId: newsItem.id,
            type: 'news',
          });

          let updatedHeroImages = newsItem.hero_images;
          if (updatedHeroImages && Array.isArray(updatedHeroImages)) {
            updatedHeroImages = updatedHeroImages.map((img: string) =>
              img === imagePath ? result.secure_url : img
            );
          }

          await nile.db.query(
            `UPDATE news SET
              image = CASE WHEN image = $2 THEN $3 ELSE image END,
              hero_images = $4,
              updated_at = NOW()
            WHERE id = $1`,
            [newsItem.id, imagePath, result.secure_url, JSON.stringify(updatedHeroImages)]
          );

          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`    ❌ Failed to migrate ${imagePath}:`, error);
        }
      }
    }

    // 3. Summary
    console.log('\n✅ Migration completed!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Total images migrated: ${migrations.length}`);
    console.log(`   - Project images: ${migrations.filter(m => m.type === 'project').length}`);
    console.log(`   - News images: ${migrations.filter(m => m.type === 'news').length}`);

    if (migrations.length > 0) {
      console.log('\n💡 Tip: You can now safely delete the /public/uploads/ folder');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrateImages();
