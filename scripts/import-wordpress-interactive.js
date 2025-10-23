import readline from 'readline';
import { WordPressParser } from './wordpress-parser.js';
import { Nile } from '@niledatabase/server';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Función para hacer preguntas al usuario
 */
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

/**
 * Mostrar los datos del proyecto para revisión
 */
function displayProject(project, index, total) {
  console.log('\n' + '='.repeat(80));
  console.log(`PROYECTO ${index} de ${total}`);
  console.log('='.repeat(80));
  console.log(`Título: ${project.title}`);
  console.log(`Slug: ${project.slug}`);
  console.log(`Año: ${project.year}`);
  console.log(`Estado: ${project.status}`);
  console.log(`\nDescripción corta:\n${project.description || '(vacío)'}`);
  console.log(`\nDetalles del proyecto:\n${project.projectDetails?.substring(0, 200) || '(vacío)'}${project.projectDetails?.length > 200 ? '...' : ''}`);
  console.log(`\nFicha técnica:\n${project.technicalSheet || '(vacío)'}`);
  console.log(`\nCurador: ${project.curator || '(vacío)'}`);
  console.log(`Locación: ${project.location || '(vacío)'}`);
  console.log(`\nCategorías: ${project.categories.join(', ') || '(ninguna)'}`);
  console.log(`\nDatos WordPress:`);
  console.log(`  - ID original: ${project.wordpress.postId}`);
  console.log(`  - Publicado: ${project.wordpress.publishedAt}`);
  console.log(`  - Video URL: ${project.wordpress.videoUrl || '(ninguno)'}`);
  console.log('='.repeat(80) + '\n');
}

/**
 * Importar un proyecto a la base de datos
 */
async function importProject(project, categoryMapping) {
  const nile = await Nile();
  const id = crypto.randomUUID();

  // Mapear categorías
  const mappedCategories = project.categories
    .map(cat => categoryMapping[cat] || cat)
    .filter(Boolean);

  // Valores para la inserción
  const values = [
    id,
    project.title,
    '', // image (placeholder - agregar manualmente)
    JSON.stringify(mappedCategories),
    project.year ?? null,
    project.description || '',
    project.slug,
    JSON.stringify([]), // tags
    false, // featured
    'published', // status
    JSON.stringify([]), // heroImages
    JSON.stringify([]), // heroImageDescriptions
    JSON.stringify([]), // heroImageDescriptions_en
    project.projectDetails || '',
    project.technicalSheet || '',
    null, // downloadLink
    '', // additionalImage
    false, // showInHomeHero
    '', // heroDescription
    null, // commissionedBy
    project.curator || null,
    project.location || null,
    null, // duration
    null, // title_en
    null, // description_en
    null, // projectDetails_en
    null, // technicalSheet_en
    null, // heroDescription_en
    null, // commissionedBy_en
    null, // curator_en
    null, // location_en
  ];

  const query = `
    INSERT INTO projects (
      id, title, image, categories, year, description, slug, tags, featured, status,
      hero_images, hero_image_descriptions, hero_image_descriptions_en,
      project_details, technical_sheet, download_link, additional_image,
      show_in_home_hero, hero_description, commissioned_by, curator, location, duration,
      title_en, description_en, project_details_en, technical_sheet_en,
      hero_description_en, commissioned_by_en, curator_en, location_en
    ) VALUES (
      $1, $2, $3, $4::jsonb, $5, $6, $7, $8::jsonb, $9, $10,
      $11::jsonb, $12::jsonb, $13::jsonb,
      $14, $15, $16, $17,
      $18, $19, $20, $21, $22, $23,
      $24, $25, $26, $27,
      $28, $29, $30, $31
    )
    RETURNING id
  `;

  try {
    const result = await nile.db.query(query, values);
    return { success: true, id: result.rows[0].id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Cargar o crear mapeo de categorías
 */
function loadCategoryMapping() {
  const mappingPath = path.join(process.cwd(), 'scripts', 'category-mapper.json');

  if (fs.existsSync(mappingPath)) {
    return JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  }

  return {};
}

/**
 * Guardar mapeo de categorías
 */
function saveCategoryMapping(mapping) {
  const mappingPath = path.join(process.cwd(), 'scripts', 'category-mapper.json');
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), 'utf-8');
}

/**
 * Mapear categorías interactivamente
 */
async function mapCategories(categories, existingMapping) {
  const mapping = { ...existingMapping };
  const newCategories = categories.filter(cat => !mapping[cat]);

  if (newCategories.length === 0) {
    console.log('\n✓ Todas las categorías ya están mapeadas.\n');
    return mapping;
  }

  console.log('\n' + '='.repeat(80));
  console.log('MAPEO DE CATEGORÍAS');
  console.log('='.repeat(80));
  console.log(`\nSe encontraron ${newCategories.length} categorías nuevas que necesitan mapeo.\n`);

  for (const category of newCategories) {
    console.log(`\nCategoría de WordPress: "${category}"`);
    const newName = await question('¿Cómo debe llamarse en el nuevo sistema? (Enter para mantener igual): ');
    mapping[category] = newName.trim() || category;
    console.log(`  ✓ Mapeada como: "${mapping[category]}"`);
  }

  saveCategoryMapping(mapping);
  console.log('\n✓ Mapeo de categorías guardado en scripts/category-mapper.json\n');

  return mapping;
}

/**
 * Función principal
 */
async function main() {
  console.log('\n' + '╔'.repeat(80));
  console.log('║ IMPORTADOR INTERACTIVO DE WORDPRESS → NILE DATABASE');
  console.log('╚'.repeat(80) + '\n');

  // Solicitar ruta del archivo XML
  const xmlPath = await question('Ruta del archivo XML de WordPress: ');

  if (!fs.existsSync(xmlPath)) {
    console.error(`\n❌ Error: El archivo "${xmlPath}" no existe.\n`);
    rl.close();
    return;
  }

  console.log('\n📖 Parseando archivo XML...');
  const parser = new WordPressParser(xmlPath);
  await parser.parse();

  const summary = parser.getSummary();

  console.log('\n' + '-'.repeat(80));
  console.log('RESUMEN DE LA EXPORTACIÓN');
  console.log('-'.repeat(80));
  console.log(`Total de proyectos: ${summary.total}`);
  console.log(`  - Publicados: ${summary.published}`);
  console.log(`  - Borradores: ${summary.draft}`);
  console.log(`Años: ${summary.years.join(', ')}`);
  console.log(`Categorías únicas: ${summary.categories.length}`);
  console.log('-'.repeat(80) + '\n');

  // Solo procesar proyectos publicados
  const publishedProjects = parser.filterByStatus('published');

  if (publishedProjects.length === 0) {
    console.log('❌ No se encontraron proyectos publicados para importar.\n');
    rl.close();
    return;
  }

  console.log(`\n✓ Se importarán ${publishedProjects.length} proyectos publicados.\n`);

  // Mapear categorías
  const categoryMapping = await mapCategories(summary.categories, loadCategoryMapping());

  console.log('\n' + '='.repeat(80));
  console.log('COMENZANDO IMPORTACIÓN INTERACTIVA');
  console.log('='.repeat(80) + '\n');

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < publishedProjects.length; i++) {
    const project = publishedProjects[i];

    // Mostrar el proyecto
    displayProject(project, i + 1, publishedProjects.length);

    // Preguntar qué hacer
    const action = await question('¿Qué deseas hacer? (i=importar, s=saltar, d=detalles completos, q=salir): ');

    if (action.toLowerCase() === 'q') {
      console.log('\n⚠️  Importación cancelada por el usuario.\n');
      break;
    }

    if (action.toLowerCase() === 'd') {
      // Mostrar detalles completos
      console.log('\n--- DETALLES COMPLETOS ---');
      console.log(JSON.stringify(project, null, 2));
      i--; // Repetir este proyecto
      continue;
    }

    if (action.toLowerCase() === 's') {
      console.log('⏭️  Proyecto saltado.\n');
      skipped++;
      continue;
    }

    if (action.toLowerCase() === 'i') {
      console.log('\n🔄 Importando proyecto...');
      const result = await importProject(project, categoryMapping);

      if (result.success) {
        imported++;
        console.log(`\n✅ Proyecto importado exitosamente!`);
        console.log(`   ID: ${result.id}`);
        console.log(`   Puedes verlo en: http://localhost:3000/admin/proyectos/editar/${result.id}`);
        console.log(`   O en el panel: http://localhost:3000/admin/proyectos\n`);

        await question('Presiona Enter para continuar con el siguiente proyecto...');
      } else {
        console.log(`\n❌ Error al importar proyecto: ${result.error}\n`);
        const retry = await question('¿Reintentar? (s/n): ');
        if (retry.toLowerCase() === 's') {
          i--; // Repetir este proyecto
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('RESUMEN DE IMPORTACIÓN');
  console.log('='.repeat(80));
  console.log(`✅ Proyectos importados: ${imported}`);
  console.log(`⏭️  Proyectos saltados: ${skipped}`);
  console.log(`📊 Total procesados: ${imported + skipped} de ${publishedProjects.length}`);
  console.log('='.repeat(80) + '\n');

  rl.close();
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  rl.close();
  process.exit(1);
});
