-- Add hero image descriptions columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS hero_image_descriptions JSONB,
ADD COLUMN IF NOT EXISTS hero_image_descriptions_en JSONB;

-- Add comments for documentation
COMMENT ON COLUMN projects.hero_image_descriptions IS 'Descriptions for each hero image in Spanish';
COMMENT ON COLUMN projects.hero_image_descriptions_en IS 'Descriptions for each hero image in English';
