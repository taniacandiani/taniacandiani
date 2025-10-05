# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development (uses Turbopack for fast refresh)
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint

# Database operations
npm run db:generate    # Generate migration from schema changes
npm run db:push        # Apply schema to Nile database (interactive)
npm run db:studio      # Open Drizzle Studio visual database editor
```

## Architecture Overview

### Data Flow Architecture

This is a **bilingual (ES/EN) artist portfolio** built with Next.js App Router, using a **three-layer architecture**:

```
Frontend (React Components)
    ↓
Storage Layer (src/lib/*Storage.ts) - Frontend abstraction
    ↓
API Routes (src/app/api/*)
    ↓
Service Layer (src/lib/db/*Service.ts) - Database abstraction
    ↓
Nile Database Client (src/db/client.ts)
    ↓
PostgreSQL (Nile Database - cloud hosted)
```

**Key Pattern**: Frontend components use `*Storage.ts` classes which call API routes. API routes use `*Service.ts` classes which execute SQL via Nile client.

### Database: Nile Database with Drizzle ORM

**Critical Constraint**: Nile Database is PostgreSQL-compatible but **does not support all PostgreSQL ALTER TABLE operations**. Specifically:
- `ALTER TABLE ... ADD CONSTRAINT IF NOT EXISTS` fails
- Some complex DDL operations from `drizzle-kit push` fail

**Schema definition**: `src/db/schema.ts` (Drizzle ORM)
**Database client**: `src/db/client.ts` (Nile SDK with lazy initialization)

#### Core Tables

**projects** - Artist projects with bilingual content
- Primary data: `id`, `title`, `slug`, `year`, `status`
- Media: `image`, `heroImages` (jsonb array), `heroImageDescriptions` (jsonb array)
- Content: `projectDetails`, `technicalSheet` (HTML from TipTap editor)
- Bilingual: Most fields have `_en` suffix versions (`title_en`, `projectDetails_en`, etc.)
- Categories: `categories` (jsonb array - projects can have multiple)

**project_tabs** - Additional tabbed content for projects (1:N relationship)
- FK: `project_id` → `projects.id` (ON DELETE CASCADE)
- Similar structure to projects but scoped to a tab

**news** - News articles with similar bilingual structure
**publications**, **about_content**, **contact_content** - Other content types
**project_categories**, **news_categories** - Category management with counts

### Database Migration Pattern (CRITICAL)

**When adding columns/tables to `src/db/schema.ts`:**

1. Generate migration: `npm run db:generate` (creates SQL in `drizzle/`)
2. **Do NOT use** `npm run db:push` directly - it often fails with Nile
3. **Instead**: Create a manual migration script `migrate.js` in root:

```javascript
import { Nile } from '@niledatabase/server';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrate() {
  const nile = await Nile();

  // Check if already applied
  const check = await nile.db.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'new_field'
  `);
  if (check.rows.length > 0) {
    console.log('Migration already applied');
    process.exit(0);
  }

  // Apply changes with simple SQL
  await nile.db.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS new_field text`);
  console.log('✓ Migration completed');
  process.exit(0);
}

migrate();
```

4. Run: `npx tsx migrate.js`
5. Delete `migrate.js` after success

**See `.claude/database-migrations.md` for detailed migration guide and troubleshooting.**

### Critical Code Patterns

#### Handling undefined vs null in Database Queries

**PostgreSQL rejects `undefined` in parameterized queries**. Always use nullish coalescing (`??`) for numeric/boolean values:

```typescript
// ❌ WRONG - converts 0 and false to other values
const values = [
  project.year || 2025,        // year=0 becomes 2025
  project.featured || false,   // always false even when featured=false
];

// ✅ CORRECT - preserves 0 and false
const values = [
  project.year ?? null,        // year=0 stays 0, undefined/null becomes null
  project.featured ?? false,   // preserves false, only defaults on undefined/null
];
```

This pattern is enforced in `src/lib/db/projectService.ts` with explicit validation.

#### JSONB Fields

Arrays (categories, tags, heroImages) are stored as JSONB:

```typescript
// Writing to DB - always stringify
await nile.db.query(
  `INSERT INTO projects (categories) VALUES ($1::jsonb)`,
  [JSON.stringify(project.categories || [])]
);

// Reading from DB - Nile auto-parses JSONB to JS objects/arrays
const result = await nile.db.query(`SELECT * FROM projects WHERE id = $1`, [id]);
const categories = result.rows[0].categories; // Already an array, no need to parse
```

#### Service Layer Pattern

All `*Service.ts` files in `src/lib/db/` follow this pattern:

```typescript
export class ProjectService {
  private static async getClient() {
    return await getNile();
  }

  static async getAll(): Promise<Project[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(`SELECT * FROM projects ORDER BY year DESC`);
    return result.rows.map(row => this.rowToProject(row));
  }

  static async create(project: Omit<Project, 'id'>): Promise<Project> {
    const nile = await this.getClient();
    const id = crypto.randomUUID();

    // Build values array with ?? for null coalescing
    const values = [
      id,
      project.title,
      project.year ?? null,
      JSON.stringify(project.categories || []),
      // ... etc
    ];

    const result = await nile.db.query(`INSERT INTO projects (...) VALUES (...)`, values);
    return this.rowToProject(result.rows[0]);
  }

  // Map DB snake_case to camelCase
  private static rowToProject(row: any): Project {
    return {
      id: row.id,
      title: row.title,
      heroImages: row.hero_images || [],
      showInHomeHero: row.show_in_home_hero,
      // ... map all fields
    };
  }
}
```

### Key Components

**RichTextEditor** (`src/components/ui/RichTextEditor.tsx`)
- TipTap-based WYSIWYG editor outputting HTML
- Used for `projectDetails`, `technicalSheet`, news `content`
- Supports: formatting, lists, links, images, text alignment, colors

**ImageUploader** (`src/components/ui/ImageUploader.tsx`)
- Uploads to Cloudinary with auto-optimization
- Organizes uploads in folders: `proyectos/{projectId}`, `noticias/{newsId}`
- Returns secure HTTPS URLs stored in database

### Environment Variables

Required in `.env.local`:

```bash
# Nile Database (PostgreSQL)
POSTGRES_URL="postgres://user:pass@us-west-2.db.thenile.dev/database"
NILEDB_URL="postgres://user:pass@us-west-2.db.thenile.dev/database"
NILEDB_USER="uuid"
NILEDB_PASSWORD="password"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="name"
CLOUDINARY_API_KEY="key"
CLOUDINARY_API_SECRET="secret"
CLOUDINARY_URL="cloudinary://key:secret@name"
```

### Admin Panel Structure

Located in `src/app/admin/`:

- **proyectos/** - Project CRUD with tabs support
  - `nuevo/page.tsx` - Create with ImageUploader, RichTextEditor, dynamic tabs
  - `editar/[id]/page.tsx` - Edit existing
  - `page.tsx` - List with filters

- **noticias/** - News CRUD (similar structure)
- **acerca/** - About page content editor
- **contacto/** - Contact page content editor
- **media/** - Media/publication management

All admin pages use `*Storage.ts` abstraction which calls API routes.

### Debugging Database Issues

**Backend logs are critical**. Run `npm run dev` and watch for:

```
=== POST /api/projects ===
Received projectData: {...}
About to execute INSERT query with values: {...}
DATABASE ERROR in ProjectService.create:
Error message: column "X" does not exist
```

Common errors:
1. **"column X does not exist"** → Run migration (see above)
2. **"Cannot insert undefined values"** → Check for `??` vs `||` (see patterns above)
3. **"syntax error at or near 'NOT'"** → Nile constraint limitation, use try/catch or omit `IF NOT EXISTS`

### Project-Specific Notes

- **Bilingual**: Almost all content has Spanish (default) and English (`_en` suffix) versions
- **Categories are arrays**: Projects/news can belong to multiple categories (changed from single category)
- **Tabs feature**: Projects can have additional tabbed sections via `project_tabs` table
- **Hero display**: Projects have `showInHomeHero` flag to control homepage carousel inclusion
- **Status workflow**: Draft → Published → Archived states available but primarily uses published/draft
- **Image optimization**: Cloudinary handles all image uploads with automatic optimization

### Type Safety

All TypeScript types are centralized in `src/types/index.ts`. Database types in `src/db/schema.ts` are compatible with these types but use different naming (snake_case in DB, camelCase in app).
