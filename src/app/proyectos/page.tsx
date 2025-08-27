import type { Metadata } from 'next';
import ProjectsSection from '@/components/ProjectsSection';
import MainLayout from '@/components/MainLayout';
import { PROJECTS, PROJECT_CATEGORIES } from '@/data/content';

export const metadata: Metadata = {
  title: 'Proyectos',
  description: 'Explora la colección completa de proyectos de Tania Candiani, incluyendo sitio específico, arqueología de los medios y prácticas sociales.',
  openGraph: {
    title: 'Proyectos | Tania Candiani',
    description: 'Explora la colección completa de proyectos de Tania Candiani.',
    type: 'website',
  },
};

export default function ProyectosPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Proyectos de Tania Candiani",
    "description": "Colección completa de proyectos artísticos de Tania Candiani",
    "url": "https://taniacandiani.com/proyectos",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": PROJECTS.length,
      "itemListElement": PROJECTS.map((project, index) => ({
        "@type": "CreativeWork",
        "position": index + 1,
        "name": project.title,
        "description": project.description,
        "url": `https://taniacandiani.com/proyectos/${project.slug}`,
        "dateCreated": project.year.toString(),
        "genre": project.category,
        "creator": {
          "@type": "Person",
          "name": "Tania Candiani"
        }
      }))
    }
  };

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProjectsSection 
        projects={PROJECTS} 
        categories={PROJECT_CATEGORIES}
      />
    </MainLayout>
  );
} 