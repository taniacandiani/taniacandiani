# Tania Candiani Portfolio - Documentación del Proyecto

## Stack Tecnológico

- **Framework:** Next.js 15.2.4 (App Router)
- **Runtime:** React 19
- **Lenguaje:** TypeScript 5
- **Base de Datos:** Nile Database (PostgreSQL compatible)
- **ORM:** Drizzle ORM 0.44.6
- **Almacenamiento de Imágenes:** Cloudinary
- **Estilos:** Tailwind CSS 4
- **Editor de Texto Rico:** TipTap 3.3.0
- **Deployment:** Vercel

## Estructura del Proyecto

```
taniacandianivercel/
├── .claude/                      # Documentación de Claude
├── drizzle/                      # Migraciones SQL generadas
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── admin/                # Panel de administración
│   │   ├── api/                  # API Routes
│   │   ├── proyectos/            # Páginas públicas
│   │   └── page.tsx              # Homepage
│   ├── components/ui/            # Componentes reutilizables
│   ├── db/
│   │   ├── client.ts             # Cliente Nile Database
│   │   └── schema.ts             # Schema Drizzle ORM
│   ├── lib/db/                   # Servicios de base de datos
│   └── types/                    # TypeScript types
├── .env.local                    # Variables de entorno (NO en Git)
└── drizzle.config.ts             # Configuración Drizzle
```

## Schema de Base de Datos

### Tabla: `projects`

```typescript
{
  id, title, image, year, description, slug,
  categories: string[] (jsonb),
  tags: string[] (jsonb),
  featured, status,
  heroImages: string[] (jsonb),
  heroImageDescriptions: string[] (jsonb),
  heroImageDescriptions_en: string[] (jsonb),
  showInHomeHero,
  projectDetails, technicalSheet,
  commissionedBy, curator, location,
  // + campos _en para traducciones
  created_at, updated_at
}
```

### Tabla: `project_tabs`

Tabs adicionales para proyectos (1:N con `projects`).

```typescript
{
  id, project_id (FK),
  tab_order, title,
  heroImages, heroImageDescriptions,
  projectDetails, technicalSheet,
  // + campos _en
}
```

## Patrones de Código Importantes

### Manejo de Valores Undefined

⚠️ PostgreSQL no acepta `undefined` en queries.

```typescript
// ❌ INCORRECTO
const values = [project.year || 2025];

// ✅ CORRECTO
const values = [project.year ?? null];
```

### Campos JSONB

```typescript
// Al escribir
JSON.stringify(project.categories || [])

// Al leer - Nile devuelve objetos JS automáticamente
const categories = result.rows[0].categories; // Ya es array
```

## Variables de Entorno

```bash
# .env.local
POSTGRES_URL="postgres://user:pass@host/db"
NILEDB_URL="postgres://user:pass@host/db"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

## Scripts NPM

```bash
npm run dev              # Desarrollo (Turbopack)
npm run build            # Build de producción
npm run db:generate      # Generar migración
npm run db:push          # Aplicar schema a DB
npm run db:studio        # Drizzle Studio GUI
```

## Componentes Clave

### RichTextEditor
Editor WYSIWYG basado en TipTap (`src/components/ui/RichTextEditor.tsx`)

### ImageUploader
Upload a Cloudinary con preview (`src/components/ui/ImageUploader.tsx`)

## Errores Comunes

1. **"column X does not exist"** → Ver `.claude/database-migrations.md`
2. **"Cannot insert undefined values"** → Usar `??` en lugar de `||`
3. **500 sin mensaje** → Revisar logs del servidor con `npm run dev`
