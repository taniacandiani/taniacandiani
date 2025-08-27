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

  useEffect(() => {
    // Initialize with existing projects if localStorage is empty
    const storedProjects = ProjectStorage.getAll();
    if (storedProjects.length === 0 && !isInitialized) {
      ProjectStorage.saveAll(PROJECTS);
      setProjects(PROJECTS);
    } else {
      setProjects(storedProjects);
    }

    // Initialize with existing categories if localStorage is empty
    const storedCategories = CategoryStorage.getAll();
    if (storedCategories.length === 0) {
      CategoryStorage.saveAll(PROJECT_CATEGORIES);
    }

    setIsInitialized(true);
  }, [isInitialized]);

  // Update categories count based on current projects
  useEffect(() => {
    if (projects.length > 0) {
      const updatedCategories = CategoryStorage.updateCounts();
      setCategories(updatedCategories);
    }
  }, [projects]);

  // Listen for category updates from admin
  useEffect(() => {
    const handleCategoriesUpdate = () => {
      const updatedCategories = CategoryStorage.updateCounts();
      setCategories(updatedCategories);
    };

    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
    };
  }, []);

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
        projects={publishedProjects} 
        categories={categories}
      />
    </MainLayout>
  );
} 