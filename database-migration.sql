-- Migración manual de la base de datos
-- Ejecutar este script directamente en la base de datos de Nile

-- IMPORTANTE: Antes de ejecutar este script, verifica si ya tienes proyectos con slugs duplicados
-- Ejecuta esta consulta primero:
-- SELECT slug, COUNT(*) FROM projects GROUP BY slug HAVING COUNT(*) > 1;

-- Si hay duplicados, necesitas actualizarlos manualmente antes de crear el constraint único

-- 1. Primero, actualiza cualquier slug duplicado (si existe)
-- Por ejemplo, si tienes proyectos con slugs duplicados, actualízalos así:
-- UPDATE projects SET slug = CONCAT(slug, '-', id) WHERE slug IN (SELECT slug FROM projects GROUP BY slug HAVING COUNT(*) > 1);

-- 2. Crear el constraint único para el slug (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_slug_unique'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT projects_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- 3. Verificar que todos los campos necesarios existen
-- Los campos hero_image_descriptions y hero_image_descriptions_en ya deberían existir
-- Si no existen, se pueden crear con:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'hero_image_descriptions'
  ) THEN
    ALTER TABLE projects ADD COLUMN hero_image_descriptions jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'hero_image_descriptions_en'
  ) THEN
    ALTER TABLE projects ADD COLUMN hero_image_descriptions_en jsonb;
  END IF;
END $$;

-- 4. Verificar que no hay valores NULL en campos requeridos
UPDATE projects
SET
  title = COALESCE(title, ''),
  slug = COALESCE(slug, ''),
  categories = COALESCE(categories, '[]'::jsonb),
  hero_images = COALESCE(hero_images, '[]'::jsonb),
  hero_image_descriptions = COALESCE(hero_image_descriptions, '[]'::jsonb),
  hero_image_descriptions_en = COALESCE(hero_image_descriptions_en, '[]'::jsonb)
WHERE
  title IS NULL
  OR slug IS NULL
  OR categories IS NULL
  OR hero_images IS NULL
  OR hero_image_descriptions IS NULL
  OR hero_image_descriptions_en IS NULL;

-- 5. Mensaje de confirmación
SELECT 'Migración completada exitosamente' AS status;