'use client';

import { useState, useEffect } from 'react';
import type { Metadata } from 'next';
import ProjectsSection from '@/components/ProjectsSection';
import MainLayout from '@/components/MainLayout';
import { PROJECTS, PROJECT_CATEGORIES } from '@/data/content';
import { ProjectStorage } from '@/lib/projectStorage';
import { CategoryStorage } from '@/lib/categoryStorage';
import { Project, ProjectCategory } from '@/types';

export default function ProyectosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>(PROJECT_CATEGORIES);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Solo ejecutar migración en el cliente
        if (typeof window !== 'undefined') {
          try {
            // Migrar proyectos existentes a múltiples categorías
            await ProjectStorage.migrateToMultipleCategories();
          } catch (error) {
            console.error('Error durante migración:', error);
          }
        }
        
        // Initialize with existing projects if storage is empty
        const storedProjects = await ProjectStorage.getAll();
        if (storedProjects.length === 0 && !isInitialized) {
          // Note: saveAll is not implemented in the new async version
          // We'll rely on the JSON files for now
          console.log('Using default projects from content.ts');
          setProjects(PROJECTS);
        } else {
          setProjects(storedProjects);
        }

        // Initialize with existing categories if storage is empty
        const storedCategories = await CategoryStorage.getAll();
        if (storedCategories.length === 0) {
          // Note: saveAll is not implemented in the new async version
          // We'll rely on the JSON files for now
          console.log('Using default categories from content.ts');
          setCategories(PROJECT_CATEGORIES);
        } else {
          setCategories(storedCategories);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing projects data:', error);
        // Fallback to static content
        setProjects(PROJECTS);
        setCategories(PROJECT_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [isInitialized]);

  // Update categories count based on current projects
  useEffect(() => {
    if (projects.length > 0) {
      const updateCategoryCounts = async () => {
        try {
          const updatedCategories = await CategoryStorage.updateCounts();
          setCategories(updatedCategories);
        } catch (error) {
          console.error('Error updating category counts:', error);
        }
      };

      updateCategoryCounts();
    }
  }, [projects]);

  // Listen for category updates from admin
  useEffect(() => {
    const handleCategoriesUpdate = async () => {
      try {
        const updatedCategories = await CategoryStorage.updateCounts();
        setCategories(updatedCategories);
      } catch (error) {
        console.error('Error updating categories:', error);
      }
    };

    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
    };
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando proyectos...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const publishedProjects = projects.filter(p => p.status === 'published');

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Proyectos de Tania Candiani",
    "description": "Colección completa de proyectos artísticos de Tania Candiani",
    "url": "https://taniacandiani.com/proyectos",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": publishedProjects.length,
      "itemListElement": publishedProjects.map((project, index) => ({
        "@type": "CreativeWork",
        "position": index + 1,
        "name": project.title,
        "description": project.description,
        "url": `https://taniacandiani.com/proyectos/${project.slug}`,
        "dateCreated": project.year.toString(),
        "genre": project.categories?.join(', ') || 'Sin categoría',
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
        projects={publishedProjects} 
        categories={categories}
      />
    </MainLayout>
  );
} 