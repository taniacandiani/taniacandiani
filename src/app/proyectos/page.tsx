import ProjectsSection from '@/components/ProjectsSection';
import MainLayout from '@/components/MainLayout';
import { PROJECTS, PROJECT_CATEGORIES } from '@/data/content';

export default function ProyectosPage() {
  return (
    <MainLayout>
      <ProjectsSection 
        projects={PROJECTS} 
        categories={PROJECT_CATEGORIES}
      />
    </MainLayout>
  );
} 