import Image from 'next/image';
import { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-[2/1] mb-4 overflow-hidden rounded-md">
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-md"
        />
      </div>
      
      {/* Border debajo de la imagen */}
      <div className="border-b border-[#E6E0E0] mb-4"></div>
      
      <h4 className="projects-h4 text-xl font-normal text-gray-900 mb-2">
        {project.title}
      </h4>
      
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>{project.category}</span>
        <span>•</span>
        <span>{project.year}</span>
      </div>
    </div>
  );
} 