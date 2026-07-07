'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Project } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { optimizeCloudinaryUrl, CLOUDINARY_PRESETS } from '@/lib/cloudinaryUtils';
import { generateNewsExcerpt } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  priority?: boolean;
}

export default function ProjectCard({ project, priority = false }: ProjectCardProps) {
  const { language } = useLanguage();

  // Get the title and subtitle based on current language
  const title = language === 'en' && project.title_en ? project.title_en : project.title;
  const subtitle = language === 'en' && project.subtitle_en ? project.subtitle_en : project.subtitle;

  // Usar el extracto precalculado por la API (modo resumen) si está disponible;
  // si no, calcularlo a partir del contenido completo
  const precomputedExcerpt = language === 'en'
    ? (project.excerpt_en || project.excerpt)
    : (project.excerpt || project.excerpt_en);

  const projectDetails = language === 'en' && project.projectDetails_en
    ? project.projectDetails_en
    : project.projectDetails;
  const excerpt = precomputedExcerpt || generateNewsExcerpt(projectDetails || project.description || '', 150);

  return (
    <Link href={`/proyectos/${project.slug}`} className="group cursor-pointer block">
      <div className="space-y-4">
        <div className="relative aspect-[2/1] overflow-hidden rounded-md">
          <Image
            src={optimizeCloudinaryUrl(
              project.heroImages && project.heroImages[0] ? project.heroImages[0] : project.image,
              CLOUDINARY_PRESETS.card
            )}
            alt={`Imagen del proyecto ${title}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-md"
            priority={priority}
            quality={75}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              {(() => {
                if (!project.categories || project.categories.length === 0) {
                  return language === 'en' ? 'No category' : 'Sin categoría';
                }

                const maxCategories = 3;
                const displayCategories = project.categories.slice(0, maxCategories);
                const remainingCount = project.categories.length - maxCategories;

                let text = displayCategories.join(', ');
                if (remainingCount > 0) {
                  text += ` +${remainingCount}`;
                }

                return text;
              })()}
            </span>
            <span>•</span>
            <span>{project.year}</span>
          </div>

          <h4 className="projects-h4 text-xl font-normal text-gray-900">
            {title}
          </h4>

          <div className="text-black text-sm leading-relaxed">
            {excerpt}
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center text-black text-sm group-hover:underline">
              {language === 'en' ? 'View Project' : 'Ver Proyecto'}
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
} 