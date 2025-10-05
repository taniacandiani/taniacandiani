# Guía de Migraciones de Base de Datos - Nile Database

## Problema Común: Columnas Faltantes

**Síntoma:** Error `column "X" of relation "Y" does not exist` al crear/editar proyectos o noticias.

**Causa:** El schema de Drizzle (`src/db/schema.ts`) está actualizado pero la base de datos en Nile no tiene las columnas/tablas nuevas.

## Solución Rápida

### Opción 1: Script de Migración Manual (RECOMENDADO)

Cuando `drizzle-kit push` falla debido a limitaciones de Nile, usa un script Node.js:

```bash
npx tsx migrate.js
```

**Crear `migrate.js` en la raíz del proyecto:**

```javascript
import { Nile } from '@niledatabase/server';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrate() {
  console.log('Connecting to Nile database...');
  const nile = await Nile();

  try {
    // Verificar si la migración ya se aplicó
    console.log('Checking if migration is needed...');
    const checkColumn = await nile.db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'projects'
      AND column_name = 'hero_image_descriptions'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✓ Migration already applied. Database is up to date.');
      process.exit(0);
    }

    console.log('Applying migration...');

    // Agregar columnas faltantes
    await nile.db.query(`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS hero_image_descriptions jsonb
    `);
    console.log('✓ Added hero_image_descriptions column');

    await nile.db.query(`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS hero_image_descriptions_en jsonb
    `);
    console.log('✓ Added hero_image_descriptions_en column');

    // Crear tabla project_tabs si no existe
    await nile.db.query(`
      CREATE TABLE IF NOT EXISTS project_tabs (
        id varchar(255) PRIMARY KEY NOT NULL,
        project_id varchar(255) NOT NULL,
        tab_order integer NOT NULL,
        title varchar(500) NOT NULL,
        hero_images jsonb,
        hero_image_descriptions jsonb,
        hero_image_descriptions_en jsonb,
        additional_image text,
        project_details text,
        technical_sheet text,
        title_en varchar(500),
        project_details_en text,
        technical_sheet_en text,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )
    `);
    console.log('✓ Created project_tabs table');

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
```

### Opción 2: drizzle-kit push (si funciona)

```bash
npm run db:push
```

**Importante:** Si aparecen preguntas interactivas:
- `Is X table created or renamed?` → Seleccionar **create table**
- `Is X column created or renamed?` → Seleccionar **create column**
- `Add unique constraint without truncating?` → Seleccionar **No, add without truncating**

⚠️ **Limitaciones de Nile:**
- No soporta `ALTER TABLE ... ADD CONSTRAINT IF NOT EXISTS` con sintaxis completa
- Algunas operaciones de Drizzle fallan y requieren SQL manual

## Historial de Migraciones

### Migración: Tabs & Hero Image Descriptions (2025-01-05)

**Problema:** Error al crear proyectos: `column "hero_image_descriptions" does not exist`

**Cambios aplicados:**
1. Agregada columna `hero_image_descriptions` (jsonb) a `projects`
2. Agregada columna `hero_image_descriptions_en` (jsonb) a `projects`
3. Creada tabla `project_tabs` para soporte de tabs en proyectos
4. Agregada foreign key `project_tabs.project_id` → `projects.id` con `ON DELETE cascade`

**Fix adicional en código:**
- Modificado `projectService.ts` para usar `??` en lugar de `||` para valores booleanos y numéricos
- Agregado error explícito si hay valores `undefined` antes de ejecutar query

## Troubleshooting

### Error: "this form of ALTER TABLE is not supported"

**Causa:** Nile no soporta ciertos comandos ALTER TABLE de PostgreSQL.

**Solución:** Usar script manual con comandos simples.

### Error: "Cannot insert undefined values into database"

**Causa:** JavaScript envía `undefined` en lugar de `null` o un valor por defecto.

**Solución:** Usar nullish coalescing (`??`) para valores numéricos/booleanos:

```typescript
// ❌ Incorrecto
project.year || 2025           // Si year=0, retorna 2025
project.featured || false      // Si featured=false, retorna false

// ✅ Correcto
project.year ?? null           // Si year=0, retorna 0
project.featured ?? false      // Si featured=false, retorna false
```

## Scripts Disponibles

```bash
npm run db:generate      # Generar migración desde schema
npm run db:push          # Aplicar migración (push to database)
npm run db:studio        # Abrir Drizzle Studio (visual database editor)
```
