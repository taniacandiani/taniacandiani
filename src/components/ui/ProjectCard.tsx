'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Project } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const { language } = useLanguage();

  // Get the title and subtitle based on current language
  const title = language === 'en' && project.title_en ? project.title_en : project.title;
  const subtitle = language === 'en' && project.subtitle_en ? project.subtitle_en : project.subtitle;

  return (
    <Link href={`/proyectos/${project.slug}`} className="group cursor-pointer block">
      <div className="relative aspect-[2/1] mb-4 overflow-hidden rounded-md">
        <Image
          src={project.heroImages && project.heroImages[0] ? project.heroImages[0] : project.image}
          alt={`Imagen del proyecto ${title}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-md"
          loading="lazy"
        />

      </div>

      <div className="border-b border-[#E6E0E0] mb-4"></div>

      <h4 className="projects-h4 text-xl font-normal text-gray-900 mb-2">
        {title}
      </h4>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>{project.categories?.join(', ') || (language === 'en' ? 'No category' : 'Sin categoría')}</span>
        <span>•</span>
        <span>{project.year}</span>
      </div>
    </Link>
  );
} 