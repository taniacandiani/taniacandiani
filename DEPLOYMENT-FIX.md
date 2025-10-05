# Solución para el Deploy en Vercel

## Problema
El build en Vercel se quedaba colgado por 45+ minutos porque `drizzle-kit push` estaba esperando una confirmación interactiva para agregar un constraint único al campo `slug` de la tabla `projects`.

## Soluciones Implementadas

### 1. Comando de Build Actualizado
Se removió `drizzle-kit push --force` del comando de build en `package.json`:

**Antes:**
```json
"build": "drizzle-kit push --force && next build",
```

**Ahora:**
```json
"build": "next build",
```

### 2. Migración Manual de Base de Datos
Las migraciones de esquema ahora deben hacerse manualmente antes del deploy:

1. **Ejecuta el script de migración** en tu base de datos de Nile:
   - Usa el archivo `database-migration.sql`
   - O ejecuta los comandos manualmente

2. **Verifica proyectos con slugs duplicados** (si los hay):
   ```sql
   SELECT slug, COUNT(*) FROM projects
   GROUP BY slug
   HAVING COUNT(*) > 1;
   ```

3. **Si hay duplicados**, actualízalos antes de crear el constraint:
   ```sql
   UPDATE projects
   SET slug = CONCAT(slug, '-', id)
   WHERE slug IN (
     SELECT slug FROM projects
     GROUP BY slug
     HAVING COUNT(*) > 1
   );
   ```

## Campos Corregidos

Se agregaron los siguientes campos que faltaban al guardar proyectos:
- `heroImageDescriptions` - Descripciones de imágenes del hero en español
- `heroImageDescriptions_en` - Descripciones de imágenes del hero en inglés
- Todos los campos de traducción al inglés (`title_en`, `subtitle_en`, etc.)

## Sistema de Carpetas Temporales

El sistema de carpetas temporales para imágenes **funciona correctamente**:
1. Las imágenes se suben a una carpeta temporal (`temp-[timestamp]`)
2. Al guardar el proyecto, se mueven a la carpeta final (`proyectos/[slug]`)
3. Esto evita tener que conocer el título del proyecto antes de subir imágenes

## Pasos para Deploy

1. **Commit y push** los cambios:
   ```bash
   git add .
   git commit -m "fix: remove interactive drizzle-kit push from build"
   git push
   ```

2. **Ejecuta la migración** en tu base de datos de producción (si es necesario)

3. **Deploy en Vercel** debería funcionar normalmente ahora

## Notas Adicionales

- El comando `npm run db:push` sigue disponible para desarrollo local
- Las migraciones de esquema deben hacerse manualmente en producción
- El build ahora solo compila la aplicación Next.js sin modificar la base de datos