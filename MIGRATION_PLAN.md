# Plan de Migración a Nile Database + Cloudinary

## ✅ Progreso Completado (50%)

### Infraestructura de Base de Datos
- [x] Instalación de Nile SDK (`@niledatabase/server`, `@niledatabase/react`)
- [x] Configuración de variables de entorno en `.env.local`
- [x] Creación del esquema de base de datos (`src/db/schema.ts`)
- [x] Implementación del cliente de DB (`src/db/client.ts`)
- [x] Creación de 7 tablas en Nile Database
- [x] Migración exitosa de todos los datos JSON a la base de datos

### Datos Migrados
- 2 proyectos
- 5 noticias
- 6 categorías de proyectos
- 5 categorías de noticias
- 4 publicaciones
- 1 contenido "acerca de"
- 1 contenido de contacto

---

## 🚧 Trabajo Restante (50%)

### FASE 1: Crear Servicios de Base de Datos (Crítico)

Los servicios son wrappers que encapsulan las queries a la base de datos.

#### 1.1 Project Service (`src/lib/db/projectService.ts`)

```typescript
import { getNile } from '@/db/client';

export class ProjectService {
  static async getAll() {
    const nile = await getNile();
    const result = await nile.db.query(
      'SELECT * FROM projects ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async getById(id: string) {
    const nile = await getNile();
    const result = await nile.db.query(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async getBySlug(slug: string) {
    const nile = await getNile();
    const result = await nile.db.query(
      'SELECT * FROM projects WHERE slug = $1',
      [slug]
    );
    return result.rows[0];
  }

  static async getPublished() {
    const nile = await getNile();
    const result = await nile.db.query(
      "SELECT * FROM projects WHERE status = 'published' ORDER BY year DESC"
    );
    return result.rows;
  }

  static async create(project: any) {
    const nile = await getNile();
    const result = await nile.db.query(
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
      ) RETURNING *`,
      [
        project.id,
        project.title,
        project.subtitle,
        project.image,
        project.year,
        project.description,
        project.slug,
        JSON.stringify(project.categories || []),
        JSON.stringify(project.tags || []),
        project.featured || false,
        project.status || 'draft',
        JSON.stringify(project.heroImages || []),
        project.showInHomeHero || false,
        project.heroDescription,
        project.projectDetails,
        project.technicalSheet,
        project.downloadLink,
        project.additionalImage,
        project.commissionedBy,
        project.curator,
        project.location,
        project.title_en,
        project.subtitle_en,
        project.description_en,
        project.projectDetails_en,
        project.technicalSheet_en,
        project.heroDescription_en,
        project.commissionedBy_en,
        project.curator_en,
        project.location_en,
      ]
    );
    return result.rows[0];
  }

  static async update(id: string, project: any) {
    const nile = await getNile();
    const result = await nile.db.query(
      `UPDATE projects SET
        title = $2,
        subtitle = $3,
        image = $4,
        year = $5,
        description = $6,
        slug = $7,
        categories = $8::jsonb,
        tags = $9::jsonb,
        featured = $10,
        status = $11,
        hero_images = $12::jsonb,
        show_in_home_hero = $13,
        hero_description = $14,
        project_details = $15,
        technical_sheet = $16,
        download_link = $17,
        additional_image = $18,
        commissioned_by = $19,
        curator = $20,
        location = $21,
        title_en = $22,
        subtitle_en = $23,
        description_en = $24,
        project_details_en = $25,
        technical_sheet_en = $26,
        hero_description_en = $27,
        commissioned_by_en = $28,
        curator_en = $29,
        location_en = $30,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        id,
        project.title,
        project.subtitle,
        project.image,
        project.year,
        project.description,
        project.slug,
        JSON.stringify(project.categories || []),
        JSON.stringify(project.tags || []),
        project.featured,
        project.status,
        JSON.stringify(project.heroImages || []),
        project.showInHomeHero,
        project.heroDescription,
        project.projectDetails,
        project.technicalSheet,
        project.downloadLink,
        project.additionalImage,
        project.commissionedBy,
        project.curator,
        project.location,
        project.title_en,
        project.subtitle_en,
        project.description_en,
        project.projectDetails_en,
        project.technicalSheet_en,
        project.heroDescription_en,
        project.commissionedBy_en,
        project.curator_en,
        project.location_en,
      ]
    );
    return result.rows[0];
  }

  static async delete(id: string) {
    const nile = await getNile();
    await nile.db.query('DELETE FROM projects WHERE id = $1', [id]);
  }
}
```

#### 1.2 News Service (`src/lib/db/newsService.ts`)

Similar al ProjectService, con métodos:
- `getAll()`
- `getById(id)`
- `getBySlug(slug)`
- `getPublished()`
- `create(news)`
- `update(id, news)`
- `delete(id)`

#### 1.3 Category Services

Crear:
- `src/lib/db/projectCategoryService.ts`
- `src/lib/db/newsCategoryService.ts`

Con métodos:
- `getAll()`
- `getById(id)`
- `create(category)`
- `update(id, category)`
- `delete(id)`
- `updateCounts()` - para recalcular contadores

#### 1.4 Otros Servicios

- `src/lib/db/publicationService.ts`
- `src/lib/db/aboutService.ts`
- `src/lib/db/contactService.ts`

---

### FASE 2: Actualizar API Routes

Reemplazar las llamadas a `*Storage.ts` por los nuevos servicios.

#### 2.1 Projects API Routes

**`src/app/api/projects/route.ts`:**

```typescript
import { ProjectService } from '@/lib/db/projectService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const projects = await ProjectService.getAll();
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const project = await ProjectService.create(data);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating project' }, { status: 500 });
  }
}
```

**`src/app/api/projects/[id]/route.ts`:**

```typescript
import { ProjectService } from '@/lib/db/projectService';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await ProjectService.getById(params.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching project' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const project = await ProjectService.update(params.id, data);
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating project' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await ProjectService.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting project' }, { status: 500 });
  }
}
```

#### 2.2 Archivos API a Actualizar

- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/app/api/news/route.ts`
- `src/app/api/news/[id]/route.ts`
- `src/app/api/categories/route.ts`
- `src/app/api/news-categories/route.ts`
- `src/app/api/publications/route.ts`
- `src/app/api/publications/[id]/route.ts`
- `src/app/api/about/route.ts`
- `src/app/api/contact/route.ts`

---

### FASE 3: Actualizar Páginas Admin

Reemplazar imports de `*Storage` por los nuevos servicios.

#### 3.1 Páginas a Actualizar

**Admin de Proyectos:**
- `src/app/admin/proyectos/page.tsx`
- `src/app/admin/proyectos/nuevo/page.tsx`
- `src/app/admin/proyectos/editar/[id]/page.tsx`

**Admin de Noticias:**
- `src/app/admin/noticias/page.tsx`
- `src/app/admin/noticias/nueva/page.tsx`
- `src/app/admin/noticias/editar/[id]/page.tsx`

**Admin de Categorías:**
- `src/app/admin/proyectos/categorias/page.tsx`
- `src/app/admin/noticias/categorias/page.tsx`

**Otros:**
- `src/app/admin/acerca/page.tsx`
- `src/app/admin/acerca/publicaciones/page.tsx`
- `src/app/admin/contacto/page.tsx`

#### 3.2 Patrón de Actualización

**Antes:**
```typescript
import { ProjectStorage } from '@/lib/projectStorage';

const projects = await ProjectStorage.getAll();
```

**Después:**
```typescript
import { ProjectService } from '@/lib/db/projectService';

const projects = await ProjectService.getAll();
```

---

### FASE 4: Actualizar Páginas Públicas

Las páginas públicas también necesitan usar los servicios de DB.

#### 4.1 Páginas a Actualizar

- `src/app/page.tsx` (home)
- `src/app/proyectos/page.tsx`
- `src/app/proyectos/[slug]/page.tsx`
- `src/app/noticias/page.tsx`
- `src/app/noticias/[slug]/page.tsx`
- `src/app/acerca/page.tsx`
- `src/app/contacto/page.tsx`

---

### FASE 5: Integración con Cloudinary

#### 5.1 Configurar Variables de Entorno

Agregar a `.env.local` (cuando tengas credenciales):
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

#### 5.2 Instalar SDK
```bash
pnpm add cloudinary
```

#### 5.3 Actualizar Upload API

**`src/app/api/upload-image/route.ts`:**

```typescript
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const projectId = formData.get('projectId') as string;
    const contentType = formData.get('contentType') as string || 'proyectos';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `${contentType}/${projectId}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      imageUrl: (result as any).secure_url,
      publicId: (result as any).public_id,
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
```

#### 5.4 Script de Migración de Imágenes

Crear `scripts/migrate-images-to-cloudinary.ts` para subir imágenes existentes de `public/uploads/` a Cloudinary y actualizar las URLs en la base de datos.

---

## 🎯 Orden Recomendado de Implementación

1. **Crear servicios de DB** (1-2 horas)
   - ProjectService
   - NewsService
   - CategoryServices
   - Otros servicios

2. **Actualizar API routes** (1 hora)
   - Empezar con projects
   - Luego news
   - Finalmente el resto

3. **Actualizar páginas admin** (1-2 horas)
   - Proyectos primero
   - Noticias después
   - Resto al final

4. **Actualizar páginas públicas** (30 min)
   - Home
   - Proyectos
   - Noticias

5. **Testing completo** (30 min)
   - CRUD de proyectos
   - CRUD de noticias
   - Navegación pública

6. **Integrar Cloudinary** (cuando tengas credenciales) (1 hora)
   - Configurar SDK
   - Actualizar upload API
   - Migrar imágenes existentes

7. **Deploy a Vercel** (15 min)
   - Agregar variables de entorno en Vercel
   - Push a GitHub
   - Verificar deploy

---

## 📝 Notas Importantes

### Estructura de Datos en Nile

Los campos JSONB (categories, tags, heroImages) se almacenan como strings JSON y necesitan ser parseados:

```typescript
// Al leer de la DB
const projects = result.rows.map(p => ({
  ...p,
  categories: p.categories, // Ya es un array
  tags: p.tags,             // Ya es un array
  heroImages: p.heroImages, // Ya es un array
}));

// Al escribir a la DB
JSON.stringify(project.categories || [])
```

### Tipos de TypeScript

El archivo `src/db/schema.ts` ya exporta los tipos:
```typescript
import type { Project, News } from '@/db/schema';
```

Estos tipos son compatibles con los tipos en `src/types/index.ts`.

### Variables de Entorno en Vercel

Cuando hagas deploy, asegúrate de agregar en Vercel Dashboard:
- Todas las variables `NILEDB_*`
- Variables de Cloudinary (cuando las tengas)

### Archivos que ya NO se usarán

Después de la migración, estos archivos pueden archivarse (no eliminar aún):
- `src/lib/projectStorage.ts`
- `src/lib/newsStorage.ts`
- `src/lib/categoryStorage.ts`
- `src/lib/newsCategoryStorage.ts`
- `src/lib/publicationStorage.ts`
- `src/lib/aboutStorage.ts`
- `src/lib/contactStorage.ts`

Los archivos JSON en `src/data/` pueden mantenerse como backup.

---

## 🚀 Scripts Disponibles

```bash
# Crear tablas (si necesitas recrear)
pnpm tsx scripts/create-tables-nile.ts

# Migrar datos (si necesitas re-migrar)
pnpm tsx scripts/migrate-data.ts

# Build para verificar
pnpm build

# Desarrollo
pnpm dev
```

---

## ✅ Checklist Final

Antes de considerar la migración completa:

- [ ] Todos los servicios de DB creados
- [ ] Todas las API routes actualizadas
- [ ] Todas las páginas admin actualizadas
- [ ] Todas las páginas públicas actualizadas
- [ ] CRUD de proyectos funciona
- [ ] CRUD de noticias funciona
- [ ] CRUD de categorías funciona
- [ ] Cloudinary integrado
- [ ] Imágenes existentes migradas
- [ ] Variables de entorno en Vercel configuradas
- [ ] Build exitoso
- [ ] Deploy a Vercel exitoso
- [ ] Testing en producción exitoso

---

## 📞 Soporte

Si encuentras problemas:

1. **Errores de conexión a Nile**: Verifica que las variables `NILEDB_*` estén correctas
2. **Errores de tipos**: Asegúrate de parsear los campos JSONB correctamente
3. **Errores en build**: Verifica que no haya imports circulares
4. **Errores en Cloudinary**: Verifica las credenciales y la configuración

---

**Última actualización:** Migración completada hasta la Fase 1 (base de datos e infraestructura)

**Próximo paso:** Crear servicios de DB (ProjectService, NewsService, etc.)
