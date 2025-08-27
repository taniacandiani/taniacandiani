'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { Project, ProjectCategory } from '@/types';
import { ProjectStorage } from '@/lib/projectStorage';
import { CategoryStorage } from '@/lib/categoryStorage';
import { PROJECTS, PROJECT_CATEGORIES } from '@/data/content';
import RichContent from '@/components/ui/RichContent';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function ProjectPage({ params }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('detalles');
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>(PROJECT_CATEGORIES);

  // Always define slider images, even if project is null
  const sliderImages = (() => {
    if (!project) return ['/fondo1.jpg'];
    
    // Use hero images if they exist and have content
    if (project.heroImages && project.heroImages.length > 0) {
      const validHeroImages = project.heroImages.filter(img => img && img.trim() !== '');
      if (validHeroImages.length > 0) {
        return validHeroImages;
      }
    }
    
    // Final fallback
    return ['/fondo1.jpg'];
  })();
  


  // Get available years from all projects
  const availableYears = [...new Set(allProjects.map(p => p.year))].sort((a, b) => b - a);

  // Get previous and next projects for navigation
  const getNavigationProjects = () => {
    if (!project || allProjects.length === 0) return { previous: null, next: null };
    
    const currentIndex = allProjects.findIndex(p => p.id === project.id);
    if (currentIndex === -1) return { previous: null, next: null };
    
    const previous = currentIndex > 0 ? allProjects[currentIndex - 1] : null;
    const next = currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : null;
    
    return { previous, next };
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Main data loading effect - always runs
  useEffect(() => {
    async function loadProject() {
      try {
        // Await params to get the slug
        const { slug } = await params;
        
        // Initialize with existing projects if localStorage is empty
        const storedProjects = ProjectStorage.getAll();
        if (storedProjects.length === 0) {
          ProjectStorage.saveAll(PROJECTS);
        }
        
        // Get all projects for sidebar
        const projects = ProjectStorage.getPublished();
        setAllProjects(projects);
        
        // Initialize with existing categories if localStorage is empty
        const storedCategories = CategoryStorage.getAll();
        if (storedCategories.length === 0) {
          CategoryStorage.saveAll(PROJECT_CATEGORIES);
        }
        
        // Update categories count based on current projects
        const updatedCategories = CategoryStorage.updateCounts();
        setCategories(updatedCategories);
        
        // Find project by slug
        const foundProject = ProjectStorage.getBySlug(slug) || 
                             PROJECTS.find(p => p.slug === slug);
        
        if (!foundProject) {
          notFound();
          return;
        }
        
        setProject(foundProject);
      } catch (error) {
        console.error('Error loading project:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [params]);

  // Listen for category updates from admin
  useEffect(() => {
    const handleCategoriesUpdate = () => {
      const updatedCategories = CategoryStorage.updateCounts();
      setCategories(updatedCategories);
    };

    const handleProjectsUpdate = async () => {
      // Reload the current project to get updated images
      try {
        const { slug } = await params;
        if (slug) {
          const updatedProject = ProjectStorage.getBySlug(slug);
                  if (updatedProject) {
          setProject(updatedProject);
        }
        }
      } catch (error) {
        console.error('Error updating project:', error);
      }
    };

    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    window.addEventListener('projectsUpdated', handleProjectsUpdate);
    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
      window.removeEventListener('projectsUpdated', handleProjectsUpdate);
    };
  }, [params]);

  // Auto-rotate del slider - always runs
  useEffect(() => {
    if (sliderImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [sliderImages.length]);

  // Render loading state
  if (loading || !project) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Cargando...</h1>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-8 py-8 pt-16">
        <div className="flex gap-8">
          {/* Sidebar Izquierdo */}
          <div className="w-64">
            {/* Título sticky */}
            <div className="sticky top-32 bg-white z-10 mb-8">
              <h1 className="text-lg text-white bg-black px-4 py-2 text-center w-full" style={{ borderRadius: '5px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                {project.title}
              </h1>
            </div>

            {/* Resto del contenido */}
            <div>
              <div className="border-b border-gray-300 mb-4"></div>
              <p className="text-base text-gray-800 mb-8" style={{ fontWeight: 900 }}>
                {project.subtitle || project.title}
              </p>

              {/* Datos del proyecto */}
              {project.projectInfo && project.projectInfo.length > 0 && (
                <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
                  {project.projectInfo.map((info, index) => (
                    <p key={index} className="text-base mb-2">
                      <span className="font-medium">{info.label}</span><br />
                      <span className="text-gray-600">{info.value}</span>
                    </p>
                  ))}
                  
                  {project.downloadLink && (
                    <div className="mt-4">
                      <a 
                        href={project.downloadLink}
                        className="flex items-center gap-2 text-base border border-gray-300 px-3 py-1 rounded hover:bg-gray-50"
                      >
                        <span>Descargar</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                          picture_as_pdf
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Información adicional */}
              {(project.commissionedBy || project.curator || project.location) && (
                <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
                  <h4 className="projects-h4 text-lg font-normal mb-4">Información</h4>
                  {project.commissionedBy && (
                    <div className="text-base text-gray-600 py-1">
                      <span className="font-medium">Comisionado por:</span><br />
                      {project.commissionedBy}
                    </div>
                  )}
                  {project.curator && (
                    <div className="text-base text-gray-600 py-1">
                      <span className="font-medium">Curador/a:</span><br />
                      {project.curator}
                    </div>
                  )}
                  {project.location && (
                    <div className="text-base text-gray-600 py-1">
                      <span className="font-medium">Ubicación:</span><br />
                      {project.location}
                    </div>
                  )}
                </div>
              )}

              {/* Categorías */}
              <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
                <h4 className="projects-h4 text-lg font-normal mb-4">Categorías</h4>
                <div className="space-y-2">
                  <Link
                    href="/proyectos"
                    className={`block w-full text-left py-1 text-base transition-all duration-200 text-gray-500 hover:text-black`}
                  >
                    Todas las categorías
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/proyectos?category=${encodeURIComponent(category.name)}`}
                      className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                        project.categories?.includes(category.name)
                          ? 'text-black'
                          : 'text-gray-500 hover:text-black'
                      }`}
                    >
                      {category.name} ({category.count})
                    </Link>
                  ))}
                </div>
              </div>

              {/* Año */}
              <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
                <h4 className="projects-h4 text-lg font-normal mb-4">Año</h4>
                <div className="space-y-2">
                  <Link
                    href="/proyectos"
                    className={`block w-full text-left py-1 text-base transition-all duration-200 text-gray-500 hover:text-black`}
                  >
                    Todos los años
                  </Link>
                  {availableYears.map((year) => (
                    <Link
                      key={year}
                      href={`/proyectos?year=${year}`}
                      className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                        project.year === year
                          ? 'text-black'
                          : 'text-gray-500 hover:text-black'
                      }`}
                    >
                      {year}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="flex-1">
            {/* Slider con puntitos */}
            <div className="relative mb-8">
              <div className="relative aspect-[16/7] overflow-hidden group" style={{ borderRadius: '5px' }}>
                <Image
                  src={sliderImages[currentSlide]}
                  alt={`${project.title} - Slide ${currentSlide + 1}`}
                  fill
                  className="object-cover"
                />
                
                {/* Flechas de navegación - solo mostrar si hay múltiples imágenes */}
                {sliderImages.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-75"
                      aria-label="Imagen anterior"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={nextSlide}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-75"
                      aria-label="Imagen siguiente"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              {/* Puntitos indicadores - solo mostrar si hay múltiples imágenes */}
              {sliderImages.length > 1 && (
                <div className="flex justify-center space-x-2 mt-4">
                  {sliderImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-3 h-3 rounded-full ${
                        index === currentSlide ? 'bg-black' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Breadcrumb */}
            <div className="mb-6 pb-4 border-b border-gray-200">
              <nav className="text-sm">
                <Link href="/" className="text-gray-500 hover:text-black">
                  Inicio
                </Link>
                <span className="mx-2 text-gray-400">/</span>
                <Link href="/proyectos" className="text-gray-500 hover:text-black">
                  Proyectos
                </Link>
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-black">{project.title}</span>
              </nav>
            </div>

            {/* Título del proyecto */}
            <div className="mb-8">
              <h1 className="mb-4" style={{ fontWeight: 500, fontSize: '8rem', lineHeight: 1 }}>{project.title}</h1>
              
              <div className="flex items-center gap-4 text-base text-gray-600">
                <span>
                  Categorías: 
                  {project.categories?.map((category, index) => (
                    <span key={category}>
                      <Link 
                        href={`/proyectos?category=${encodeURIComponent(category)}`}
                        className="font-medium hover:text-black transition-colors cursor-pointer ml-1"
                      >
                        {category}
                      </Link>
                      {index < (project.categories?.length || 0) - 1 && <span className="mx-1">,</span>}
                    </span>
                  ))}
                </span>
                <span>
                  Año: 
                  <Link 
                    href={`/proyectos?year=${project.year}`}
                    className="font-medium hover:text-black transition-colors cursor-pointer ml-1"
                  >
                    {project.year}
                  </Link>
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8">
              <div className="grid grid-cols-3 border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('detalles')}
                  className={`px-6 pt-8 pb-6 text-lg font-medium border-r border-gray-200 ${
                    activeTab === 'detalles'
                      ? 'border-b-2 border-b-black text-black bg-gray-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Detalles del Proyecto
                </button>
                <button
                  onClick={() => setActiveTab('ficha')}
                  className={`px-6 pt-8 pb-6 text-lg font-medium border-r border-gray-200 ${
                    activeTab === 'ficha'
                      ? 'border-b-2 border-b-black text-black bg-gray-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Ficha Técnica
                </button>
                {project.downloadLink ? (
                  <a
                    href={project.downloadLink}
                    className="px-6 pt-8 pb-6 text-lg font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <span>Descargar</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      picture_as_pdf
                    </span>
                  </a>
                ) : (
                  <div className="px-6 pt-8 pb-6 text-lg font-medium text-gray-300 flex items-center justify-center gap-2">
                    <span>Descargar</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      picture_as_pdf
                    </span>
                  </div>
                )}
              </div>

              {/* Contenido de los tabs */}
              <div className="text-base text-black leading-relaxed pt-8 pb-8">
                {activeTab === 'detalles' && (
                  <div>
                    {project.projectDetails ? (
                      <RichContent content={project.projectDetails} />
                    ) : (
                      <p>Detalles del proyecto no disponibles.</p>
                    )}
                  </div>
                )}
                {activeTab === 'ficha' && (
                  <div>
                    {project.technicalSheet ? (
                      <RichContent content={project.technicalSheet} />
                    ) : (
                      <p>Información técnica no disponible para este proyecto.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Imagen secundaria */}
            {project.image && (
              <div className="mb-32">
                <div className="relative aspect-[16/6] overflow-hidden" style={{ borderRadius: '5px' }}>
                  <Image
                    src={project.image}
                    alt={`${project.title} - Imagen secundaria`}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Navegación inferior */}
            <div className="border-t border-gray-200">
              <div className="grid grid-cols-3 pt-8">
                {/* Proyecto Anterior */}
                {(() => {
                  const { previous } = getNavigationProjects();
                  return previous ? (
                    <Link
                      href={`/proyectos/${previous.slug}`}
                      className="px-6 text-lg font-medium text-gray-600 hover:text-black border-r border-gray-200 text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">
                          arrow_back
                        </span>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Proyecto Anterior</div>
                          <div className="font-medium">{previous.title}</div>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="px-6 text-lg font-medium text-gray-300 border-r border-gray-200 text-left">
                      <div className="text-xs text-gray-400 mb-1">Proyecto Anterior</div>
                      <div>No disponible</div>
                    </div>
                  );
                })()}
                
                {/* Descargar (Centro) */}
                {project.downloadLink ? (
                  <a
                    href={project.downloadLink}
                    className="px-6 text-lg font-medium text-gray-600 hover:text-black border-r border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <span>Descargar</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      picture_as_pdf
                    </span>
                  </a>
                ) : (
                  <div className="px-6 text-lg font-medium text-gray-300 border-r border-gray-200 flex items-center justify-center gap-2">
                    <span>Descargar</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      picture_as_pdf
                    </span>
                  </div>
                )}
                
                {/* Siguiente Proyecto */}
                {(() => {
                  const { next } = getNavigationProjects();
                  return next ? (
                    <Link
                      href={`/proyectos/${next.slug}`}
                      className="px-6 text-lg font-medium text-gray-600 hover:text-black text-right group"
                    >
                      <div className="flex items-center justify-end gap-2">
                        <div className="text-right">
                          <div className="text-xs text-gray-400 mb-1">Siguiente Proyecto</div>
                          <div className="font-medium">{next.title}</div>
                        </div>
                        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <div className="px-6 text-lg font-medium text-gray-300 text-right">
                      <div className="text-xs text-gray-400 mb-1">Siguiente Proyecto</div>
                      <div>No disponible</div>
                    </div>
                    );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
