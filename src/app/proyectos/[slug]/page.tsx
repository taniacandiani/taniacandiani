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
import { useLanguage } from '@/contexts/LanguageContext';
import { optimizeCloudinaryUrl, CLOUDINARY_PRESETS } from '@/lib/cloudinaryUtils';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function ProjectPage({ params }: Props) {
  const { language } = useLanguage();
  const [project, setProject] = useState<Project | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('detalles');
  const [activeProjectTab, setActiveProjectTab] = useState<number>(-1); // -1 for main project, 0+ for tabs
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<ProjectCategory[]>(PROJECT_CATEGORIES);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Function to process video URL and generate embed
  const getVideoEmbed = (url: string) => {
    if (!url) return null;

    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return (
        <div className="relative" style={{ paddingBottom: '40%', maxWidth: '1000px', width: '100%', marginLeft: 0, marginRight: 'auto' }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Vimeo
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      const videoId = vimeoMatch[1];
      return (
        <div className="relative" style={{ paddingBottom: '40%', maxWidth: '1000px', width: '100%', marginLeft: 0, marginRight: 'auto' }}>
          <iframe
            src={`https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479`}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    return null;
  };

  // Get localized content
  const getLocalizedContent = (field: keyof Project, fallback: string = '') => {
    if (!project) return fallback;

    if (language === 'en') {
      const enField = `${field}_en` as keyof Project;
      const enValue = project[enField];
      if (enValue && typeof enValue === 'string' && enValue.trim() !== '') {
        return enValue;
      }
    }

    const value = project[field];
    return (typeof value === 'string' ? value : fallback) || fallback;
  };

  // Always define slider images, even if project is null
  const sliderImages = (() => {
    if (!project) return ['/fondo1.jpg'];

    // Si hay un tab seleccionado, usar las imágenes del tab
    if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
      const tab = project.tabs[activeProjectTab];
      if (tab.heroImages && tab.heroImages.length > 0) {
        const validHeroImages = tab.heroImages.filter(img => img && img.trim() !== '');
        if (validHeroImages.length > 0) {
          return validHeroImages;
        }
      }
    }

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

  // Touch handlers for swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  // Main data loading effect - optimizado con llamadas paralelas
  useEffect(() => {
    async function loadProject() {
      try {
        // Await params to get the slug
        const { slug } = await params;

        // Paralelizar todas las llamadas API
        const [storedProjects, publishedProjects, storedCategories, foundProject] = await Promise.all([
          ProjectStorage.getAll().catch(() => []),
          ProjectStorage.getPublished().catch(() => []),
          CategoryStorage.getAll().catch(() => []),
          ProjectStorage.getBySlug(slug).catch(() => null)
        ]);

        // Set all projects for sidebar
        if (publishedProjects.length > 0) {
          setAllProjects(publishedProjects);
        } else if (storedProjects.length === 0) {
          console.log('Using default projects from content.ts');
          setAllProjects(PROJECTS);
        }

        // Set categories
        if (storedCategories.length > 0) {
          // Update categories count in background (no await)
          CategoryStorage.updateCounts().then(updatedCategories => {
            setCategories(updatedCategories);
          });
        } else {
          console.log('Using default categories from content.ts');
          setCategories(PROJECT_CATEGORIES);
        }

        // Check if project was found
        const project = foundProject || PROJECTS.find(p => p.slug === slug);

        if (!project) {
          notFound();
          return;
        }

        setProject(project);
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
    const handleCategoriesUpdate = async () => {
      try {
        const updatedCategories = await CategoryStorage.updateCounts();
        setCategories(updatedCategories);
      } catch (error) {
        console.error('Error updating categories:', error);
      }
    };

    const handleProjectsUpdate = async () => {
      // Reload the current project to get updated images
      try {
        const { slug } = await params;
        if (slug) {
          const updatedProject = await ProjectStorage.getBySlug(slug);
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

  // Reset slider position and content tab when switching project tabs
  useEffect(() => {
    setCurrentSlide(0);
    setActiveTab('detalles'); // Resetear a "detalles" cuando cambia de tab de proyecto
  }, [activeProjectTab]);

  // Asegurar que el tab activo sea válido (no mostrar ficha si no hay contenido)
  useEffect(() => {
    if (project && activeTab === 'ficha') {
      let hasTechnicalSheet = false;

      if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
        const tab = project.tabs[activeProjectTab];
        const hasSpanishContent = !!(tab.technicalSheet && tab.technicalSheet.trim() !== '');
        const hasEnglishContent = !!(tab.technicalSheet_en && tab.technicalSheet_en.trim() !== '');
        hasTechnicalSheet = hasSpanishContent || hasEnglishContent;
      } else {
        const hasSpanishContent = !!(project.technicalSheet && project.technicalSheet.trim() !== '');
        const hasEnglishContent = !!(project.technicalSheet_en && project.technicalSheet_en.trim() !== '');
        hasTechnicalSheet = hasSpanishContent || hasEnglishContent;
      }

      // Si no hay ficha técnica y estamos en el tab de ficha, cambiar a detalles
      if (!hasTechnicalSheet) {
        setActiveTab('detalles');
      }
    }
  }, [activeTab, activeProjectTab, project]);

  // Auto-rotate del slider - pausar cuando hover
  useEffect(() => {
    if (sliderImages.length > 1 && !isSliderHovered) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [sliderImages.length, isSliderHovered]);

  // Render loading state
  if (loading || !project) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-mobile py-4 lg:py-8 pt-12 lg:pt-24">
        {/* Mobile: Breadcrumb al inicio */}
        <div className="lg:hidden mb-4 pb-4 border-b border-gray-200">
          <nav className="text-sm">
            <Link href="/" className="text-gray-500 hover:text-black">
              {language === 'en' ? 'Home' : 'Inicio'}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/proyectos" className="text-gray-500 hover:text-black">
              {language === 'en' ? 'Projects' : 'Proyectos'}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-black">{getLocalizedContent('title')}</span>
          </nav>
        </div>

        {/* Mobile: Título y tabs arriba (antes de la imagen) */}
        <div className="lg:hidden mb-6">
          <h1 className="text-3xl font-medium mb-4">
            {getLocalizedContent('title')}
          </h1>

          {/* Tabs del proyecto en mobile */}
          {project.tabs && project.tabs.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setActiveProjectTab(-1)}
                className={`block w-full text-left py-2 px-3 text-base transition-all duration-200 rounded border border-black ${
                  activeProjectTab === -1
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                style={{ fontWeight: 600 }}
              >
                {getLocalizedContent('title')}
              </button>
              {project.tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveProjectTab(index)}
                  className={`block w-full text-left py-2 px-3 text-base transition-all duration-200 rounded border border-black ${
                    activeProjectTab === index
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {language === 'en' ? (tab.title_en || tab.title) : tab.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botón de toggle siempre fixed - Solo desktop */}
        <div className="hidden lg:block fixed top-36 left-8 z-50">
          <button
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="flex p-1 bg-white hover:bg-gray-100 rounded-md transition-colors items-center justify-center cursor-pointer shadow-lg border border-gray-200"
            aria-label={sidebarVisible ? "Ocultar sidebar" : "Mostrar sidebar"}
          >
            <span
              className="material-symbols-outlined leading-none -mt-1"
              style={{ fontSize: '32px' }}
            >
              thumbnail_bar
            </span>
          </button>
        </div>

        <div className={`flex ${sidebarVisible ? 'gap-8' : 'gap-0'} transition-all duration-300 ease-in-out`}>
          {/* Sidebar Izquierdo Fixed - Solo desktop */}
          <div className={`hidden lg:block fixed top-48 left-8 transition-all duration-300 ease-in-out ${
            sidebarVisible ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'
          }`} style={{ maxHeight: 'calc(100vh - 12rem)', overflowY: 'auto', overflowX: 'hidden' }}>
            <div className="w-64 pr-4 overflow-x-hidden">
              {/* Título y tabs - alineados con la imagen */}
              <div className="mb-8">
                <h1 className="text-lg text-white bg-black px-4 py-2 text-center w-full mb-6" style={{ borderRadius: '5px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                  {getLocalizedContent('title')}
                </h1>

                {/* Tabs del proyecto */}
                {project.tabs && project.tabs.length > 0 && (
                  <div>
                    <div className="border-b border-gray-300 mb-4"></div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveProjectTab(-1)}
                        className={`block w-full text-left py-2 px-3 text-base transition-all duration-200 rounded border border-black ${
                          activeProjectTab === -1
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {getLocalizedContent('title')}
                      </button>
                      {project.tabs.map((tab, index) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveProjectTab(index)}
                          className={`block w-full text-left py-2 px-3 text-base transition-all duration-200 rounded border border-black ${
                            activeProjectTab === index
                              ? 'bg-black text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {language === 'en' ? (tab.title_en || tab.title) : tab.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Datos del proyecto */}
              {project.projectInfo && project.projectInfo.length > 0 && (
                <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
                  {project.projectInfo.map((info, index) => (
                    <p key={index} className="text-base mb-2">
                      <span className="font-medium">{info.label}</span><br />
                      <span className="text-gray-600">{info.value}</span>
                    </p>
                  ))}
                  
                  <div className="mt-4">
                    <button
                      onClick={() => window.open(`/api/projects/${project.id}/pdf?lang=${language}`, '_blank')}
                      className="flex items-center gap-2 text-base border border-gray-300 px-3 py-1 rounded hover:bg-gray-50 w-full cursor-pointer"
                    >
                      <span>{language === 'en' ? 'Download PDF' : 'Descargar PDF'}</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        picture_as_pdf
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Información adicional */}
              {(() => {
                // Verificar qué campos tienen contenido real para el idioma actual
                const hasCommissioned = language === 'en'
                  ? project.commissionedBy_en && project.commissionedBy_en.trim() !== ''
                  : project.commissionedBy && project.commissionedBy.trim() !== '';

                const hasCurator = language === 'en'
                  ? project.curator_en && project.curator_en.trim() !== ''
                  : project.curator && project.curator.trim() !== '';

                const hasLocation = language === 'en'
                  ? project.location_en && project.location_en.trim() !== ''
                  : project.location && project.location.trim() !== '';

                const hasYear = project.year && project.year > 0;

                // Solo mostrar la sección si hay al menos un campo con contenido
                const hasAnyInfo = hasCommissioned || hasCurator || hasLocation || hasYear;

                if (!hasAnyInfo) return null;

                return (
                  <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
                    <h4 className="projects-h4 text-lg font-normal mb-4">
                      {language === 'en' ? 'Information' : 'Información'}
                    </h4>
                    {hasCommissioned && (
                      <div className="text-base text-gray-600 py-1">
                        <span className="font-medium">
                          {language === 'en' ? 'Commissioned by:' : 'Comisionado por:'}
                        </span><br />
                        {getLocalizedContent('commissionedBy')}
                      </div>
                    )}
                    {hasCurator && (
                      <div className="text-base text-gray-600 py-1">
                        <span className="font-medium">
                          {language === 'en' ? 'Curator:' : 'Curador/a:'}
                        </span><br />
                        {getLocalizedContent('curator')}
                      </div>
                    )}
                    {hasLocation && (
                      <div className="text-base text-gray-600 py-1">
                        <span className="font-medium">
                          {language === 'en' ? 'Location:' : 'Ubicación:'}
                        </span><br />
                        {getLocalizedContent('location')}
                      </div>
                    )}
                    {hasYear && (
                      <div className="text-base text-gray-600 py-1">
                        <span className="font-medium">
                          {language === 'en' ? 'Year:' : 'Año:'}
                        </span><br />
                        {project.year}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          </div>

          {/* Espaciador para sidebar fixed cuando está visible - con transición */}
          <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ease-in-out ${
            sidebarVisible ? 'w-64' : 'w-0'
          }`}></div>

          {/* Contenido Principal */}
          <div className="flex-1 transition-all duration-300 ease-in-out">
            {/* Determinar si mostrar slider o imagen estática */}
            {(() => {
              const currentTab = activeProjectTab >= 0 && project.tabs?.[activeProjectTab];
              const showWithoutSlider = currentTab
                ? currentTab.imagesWithoutSlider
                : project.imagesWithoutSlider;

              // Si está configurado sin slider, mostrar solo la primera imagen
              if (showWithoutSlider && sliderImages.length > 0) {
                return (
                  <div className="relative mb-8">
                    <div className="relative aspect-[16/9] overflow-hidden" style={{ borderRadius: '5px' }}>
                      {sliderImages[0] && sliderImages[0].trim() !== '' ? (
                        <Image
                          src={sliderImages[0]}
                          alt={`${project.title} - Imagen principal`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">Sin imagen</span>
                        </div>
                      )}

                      {/* Descripción de la primera imagen si existe */}
                      {(() => {
                        let descriptions: string[] | undefined;
                        if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
                          const tab = project.tabs[activeProjectTab];
                          descriptions = language === 'en' && tab.heroImageDescriptions_en
                            ? tab.heroImageDescriptions_en
                            : tab.heroImageDescriptions;
                        } else {
                          descriptions = language === 'en' && project.heroImageDescriptions_en
                            ? project.heroImageDescriptions_en
                            : project.heroImageDescriptions;
                        }
                        const firstDescription = descriptions?.[0];

                        if (firstDescription && firstDescription.trim() !== '') {
                          return (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 z-10">
                              <p className="text-white text-sm md:text-base drop-shadow-lg">
                                {firstDescription}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                );
              }

              // Mostrar slider normal si no está configurado sin slider
              return (
                <div
                  className="relative mb-8"
                  onMouseEnter={() => setIsSliderHovered(true)}
                  onMouseLeave={() => setIsSliderHovered(false)}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <div className="relative aspect-[16/9] overflow-hidden group" style={{ borderRadius: '5px' }}>
                {sliderImages[currentSlide] && sliderImages[currentSlide].trim() !== '' ? (
                  <Image
                    src={optimizeCloudinaryUrl(sliderImages[currentSlide], CLOUDINARY_PRESETS.slider)}
                    alt={`${project.title} - Slide ${currentSlide + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
                    quality={85}
                    loading={currentSlide === 0 ? "eager" : "lazy"}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">Sin imagen</span>
                  </div>
                )}

                {/* Descripción de la imagen actual */}
                {(() => {
                  // Determinar si estamos viendo un tab o el proyecto principal
                  let descriptions: string[] | undefined;

                  if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
                    // Usar descripciones del tab activo
                    const tab = project.tabs[activeProjectTab];
                    descriptions = language === 'en' && tab.heroImageDescriptions_en
                      ? tab.heroImageDescriptions_en
                      : tab.heroImageDescriptions;
                  } else {
                    // Usar descripciones del proyecto principal
                    descriptions = language === 'en' && project.heroImageDescriptions_en
                      ? project.heroImageDescriptions_en
                      : project.heroImageDescriptions;
                  }

                  const currentDescription = descriptions?.[currentSlide];

                  if (currentDescription && currentDescription.trim() !== '') {
                    return (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 z-10">
                        <p className="text-white text-sm md:text-base drop-shadow-lg">
                          {currentDescription}
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

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
                );
              })()}

            {/* Breadcrumb - Solo desktop */}
            <div className="hidden lg:block mb-6 pb-4 border-b border-gray-200">
              <nav className="text-sm">
                <Link href="/" className="text-gray-500 hover:text-black">
                  {language === 'en' ? 'Home' : 'Inicio'}
                </Link>
                <span className="mx-2 text-gray-400">/</span>
                <Link href="/proyectos" className="text-gray-500 hover:text-black">
                  {language === 'en' ? 'Projects' : 'Proyectos'}
                </Link>
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-black">{getLocalizedContent('title')}</span>
              </nav>
            </div>

            {/* Título del proyecto - Solo desktop */}
            <div className="hidden lg:block mb-8">
              <h1 className="mb-4" style={{ fontWeight: 500, fontSize: '6rem', lineHeight: 1 }}>
                {(() => {
                  // Si hay un tab seleccionado, mostrar el título del tab
                  if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
                    const tab = project.tabs[activeProjectTab];
                    return language === 'en' ? (tab.title_en || tab.title) : tab.title;
                  }
                  // Si no hay tab seleccionado, mostrar el título principal
                  return getLocalizedContent('title');
                })()}
              </h1>

              <div className="flex items-center gap-4 text-base text-gray-600">
                <span>
                  {language === 'en' ? 'Categories:' : 'Categorías:'}
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
                  {language === 'en' ? 'Year:' : 'Año:'}
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
              {(() => {
                // Determinar si hay contenido en la ficha técnica en CUALQUIERA de los dos idiomas
                let hasTechnicalSheet = false;
                if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
                  const tab = project.tabs[activeProjectTab];
                  // Verificar si hay contenido en español O en inglés
                  const hasSpanishContent = !!(tab.technicalSheet && tab.technicalSheet.trim() !== '');
                  const hasEnglishContent = !!(tab.technicalSheet_en && tab.technicalSheet_en.trim() !== '');
                  hasTechnicalSheet = hasSpanishContent || hasEnglishContent;
                } else {
                  // Verificar si hay contenido en español O en inglés
                  const hasSpanishContent = !!(project.technicalSheet && project.technicalSheet.trim() !== '');
                  const hasEnglishContent = !!(project.technicalSheet_en && project.technicalSheet_en.trim() !== '');
                  hasTechnicalSheet = hasSpanishContent || hasEnglishContent;
                }

                return (
                  <div className={`grid ${hasTechnicalSheet ? 'grid-cols-3' : 'grid-cols-2'} border-b border-gray-200 mb-6`}>
                    <button
                      onClick={() => setActiveTab('detalles')}
                      className={`px-3 lg:px-6 py-3 lg:pt-8 lg:pb-6 text-sm lg:text-lg font-medium border-r border-gray-200 ${
                        activeTab === 'detalles'
                          ? 'border-b-2 border-b-black text-black bg-gray-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {language === 'en' ? 'Project Details' : 'Detalles del Proyecto'}
                    </button>
                    {hasTechnicalSheet && (
                      <button
                        onClick={() => setActiveTab('ficha')}
                        className={`px-3 lg:px-6 py-3 lg:pt-8 lg:pb-6 text-sm lg:text-lg font-medium border-r border-gray-200 ${
                          activeTab === 'ficha'
                            ? 'border-b-2 border-b-black text-black bg-gray-50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {language === 'en' ? 'Technical Sheet' : 'Ficha Técnica'}
                      </button>
                    )}
                    <button
                      onClick={() => window.open(`/api/projects/${project.id}/pdf?lang=${language}`, '_blank')}
                      className="px-2 lg:px-6 py-3 lg:pt-8 lg:pb-6 text-xs lg:text-lg font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1 lg:gap-2 cursor-pointer"
                    >
                      <span>{language === 'en' ? 'Download PDF' : 'Descargar PDF'}</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        picture_as_pdf
                      </span>
                    </button>
                  </div>
                );
              })()}

              {/* Contenido de los tabs */}
              <div className="text-base text-black leading-relaxed pt-8 pb-8">
                {activeTab === 'detalles' && (
                  <div>
                    {(() => {
                      // Si hay un tab seleccionado, mostrar el contenido del tab
                      if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
                        const tab = project.tabs[activeProjectTab];
                        const content = language === 'en'
                          ? (tab.projectDetails_en || tab.projectDetails)
                          : tab.projectDetails;
                        return content ? (
                          <>
                            <RichContent content={content} />
                            {/* PDF Button for tabs - usar el PDF específico del tab */}
                            {tab.pdfUrl && (
                              <div className="mt-8 mb-4">
                                <a
                                  href={tab.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block px-6 py-3 bg-black text-white border-2 border-black font-medium rounded-lg transition-all duration-300 hover:bg-white hover:text-black"
                                >
                                  📄 {language === 'en'
                                    ? (tab.pdfButtonText_en || tab.pdfButtonText || 'View Document')
                                    : (tab.pdfButtonText || 'Ver Documento')
                                  }
                                </a>
                              </div>
                            )}
                            {/* Video Embed for tabs */}
                            {tab.videoUrl && (
                              <div className="mt-8 mb-8" style={{ marginLeft: 0, marginRight: 'auto' }}>
                                {getVideoEmbed(tab.videoUrl)}
                              </div>
                            )}
                          </>
                        ) : (
                          <p>{language === 'en' ? 'Project details not available.' : 'Detalles del proyecto no disponibles.'}</p>
                        );
                      }
                      // Si no hay tab seleccionado, mostrar el contenido principal
                      const content = getLocalizedContent('projectDetails');
                      return content ? (
                        <>
                          <RichContent content={content} />
                          {/* PDF Button */}
                          {project.pdfUrl && (
                            <div className="mt-8 mb-4">
                              <a
                                href={project.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-6 py-3 bg-black text-white border-2 border-black font-medium rounded-lg transition-all duration-300 hover:bg-white hover:text-black"
                              >
                                📄 {language === 'en'
                                  ? (project.pdfButtonText_en || project.pdfButtonText || 'View Document')
                                  : (project.pdfButtonText || 'Ver Documento')
                                }
                              </a>
                            </div>
                          )}
                          {/* Video Embed */}
                          {project.videoUrl && (
                            <div className="mt-8 mb-8" style={{ marginLeft: 0, marginRight: 'auto' }}>
                              {getVideoEmbed(project.videoUrl)}
                            </div>
                          )}
                        </>
                      ) : (
                        <p>{language === 'en' ? 'Project details not available.' : 'Detalles del proyecto no disponibles.'}</p>
                      );
                    })()}
                  </div>
                )}
                {activeTab === 'ficha' && (
                  <div>
                    {(() => {
                      // Si hay un tab seleccionado, mostrar la ficha técnica del tab
                      if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
                        const tab = project.tabs[activeProjectTab];
                        const content = language === 'en'
                          ? (tab.technicalSheet_en || tab.technicalSheet)
                          : tab.technicalSheet;
                        return content ? (
                          <RichContent content={content} />
                        ) : (
                          <p>{language === 'en' ? 'Technical sheet not available.' : 'Ficha técnica no disponible.'}</p>
                        );
                      }
                      // Si no hay tab seleccionado, mostrar la ficha técnica principal
                      const content = getLocalizedContent('technicalSheet');
                      return content ? (
                        <RichContent content={content} />
                      ) : (
                        <p>{language === 'en' ? 'Technical information not available for this project.' : 'Información técnica no disponible para este proyecto.'}</p>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Imágenes adicionales cuando no hay slider */}
            {(() => {
              const currentTab = activeProjectTab >= 0 && project.tabs?.[activeProjectTab];
              const showWithoutSlider = currentTab
                ? currentTab.imagesWithoutSlider
                : project.imagesWithoutSlider;

              // Si está configurado sin slider y hay más de una imagen, mostrar las imágenes restantes
              if (showWithoutSlider && sliderImages.length > 1) {
                const remainingImages = sliderImages.slice(1);
                let descriptions: string[] | undefined;

                // Obtener las descripciones correspondientes
                if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
                  const tab = project.tabs[activeProjectTab];
                  descriptions = language === 'en' && tab.heroImageDescriptions_en
                    ? tab.heroImageDescriptions_en
                    : tab.heroImageDescriptions;
                } else {
                  descriptions = language === 'en' && project.heroImageDescriptions_en
                    ? project.heroImageDescriptions_en
                    : project.heroImageDescriptions;
                }

                return (
                  <div className="mb-12 space-y-8">
                    {remainingImages.map((image, index) => {
                      const actualIndex = index + 1; // +1 porque empezamos desde la segunda imagen
                      const description = descriptions?.[actualIndex];

                      return image && image.trim() !== '' ? (
                        <div key={index} className="relative">
                          <div className="relative">
                            <img
                              src={image}
                              alt={`${project.title} - Imagen ${actualIndex + 1}`}
                              className="h-auto"
                              style={{ width: 'auto', maxWidth: '100%', display: 'block', borderRadius: '5px' }}
                            />
                            {description && description.trim() !== '' && (
                              <div className="mt-2 text-sm text-gray-600">
                                {description}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                );
              }
              return null;
            })()}

            {/* Imagen secundaria */}
            {(() => {
              // Si hay un tab seleccionado, mostrar la imagen secundaria del tab
              if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
                const tab = project.tabs[activeProjectTab];
                if (tab.additionalImage) {
                  return (
                    <div className="mb-32">
                      <div className="relative aspect-[16/8] overflow-hidden" style={{ borderRadius: '5px' }}>
                        <Image
                          src={tab.additionalImage}
                          alt={`${language === 'en' ? (tab.title_en || tab.title) : tab.title} - Imagen secundaria`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  );
                }
                return null; // No mostrar imagen secundaria si el tab no tiene una
              }
              // Si no hay tab seleccionado, mostrar la imagen secundaria principal
              if (project.additionalImage) {
                return (
                  <div className="mb-32">
                    <div className="relative aspect-[16/8] overflow-hidden" style={{ borderRadius: '5px' }}>
                      <Image
                        src={project.additionalImage}
                        alt={`${project.title} - Imagen secundaria`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Navegación inferior */}
            <div className="border-t border-gray-200">
              {/* Desktop: 3 columnas con PDF en el centro */}
              <div className="hidden lg:grid grid-cols-3 pt-8">
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
                          <div className="text-xs text-gray-400 mb-1">
                            {language === 'en' ? 'Previous Project' : 'Proyecto Anterior'}
                          </div>
                          <div className="font-medium">
                            {language === 'en' && previous.title_en ? previous.title_en : previous.title}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="px-6 text-lg font-medium text-gray-300 border-r border-gray-200 text-left">
                      <div className="text-xs text-gray-400 mb-1">
                        {language === 'en' ? 'Previous Project' : 'Proyecto Anterior'}
                      </div>
                      <div>{language === 'en' ? 'Not available' : 'No disponible'}</div>
                    </div>
                  );
                })()}

                {/* Descargar (Centro) */}
                <button
                  onClick={() => window.open(`/api/projects/${project.id}/pdf?lang=${language}`, '_blank')}
                  className="px-6 text-lg font-medium text-gray-600 hover:text-black border-r border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span>{language === 'en' ? 'Download PDF' : 'Descargar PDF'}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    picture_as_pdf
                  </span>
                </button>

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
                          <div className="text-xs text-gray-400 mb-1">
                            {language === 'en' ? 'Next Project' : 'Siguiente Proyecto'}
                          </div>
                          <div className="font-medium">
                            {language === 'en' && next.title_en ? next.title_en : next.title}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <div className="px-6 text-lg font-medium text-gray-300 text-right">
                      <div className="text-xs text-gray-400 mb-1">
                        {language === 'en' ? 'Next Project' : 'Siguiente Proyecto'}
                      </div>
                      <div>{language === 'en' ? 'Not available' : 'No disponible'}</div>
                    </div>
                  );
                })()}
              </div>

              {/* Mobile: 2 columnas sin PDF */}
              <div className="lg:hidden grid grid-cols-2 pt-6">
                {/* Proyecto Anterior */}
                {(() => {
                  const { previous } = getNavigationProjects();
                  return previous ? (
                    <Link
                      href={`/proyectos/${previous.slug}`}
                      className="px-3 text-sm font-medium text-gray-600 hover:text-black border-r border-gray-200 text-left"
                    >
                      <div className="flex items-start gap-1">
                        <span className="material-symbols-outlined text-sm">
                          arrow_back
                        </span>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">
                            {language === 'en' ? 'Previous' : 'Anterior'}
                          </div>
                          <div className="font-medium line-clamp-2">
                            {language === 'en' && previous.title_en ? previous.title_en : previous.title}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="px-3 text-sm font-medium text-gray-300 border-r border-gray-200 text-left">
                      <div className="text-xs text-gray-400 mb-1">
                        {language === 'en' ? 'Previous' : 'Anterior'}
                      </div>
                      <div className="text-xs">{language === 'en' ? 'Not available' : 'No disponible'}</div>
                    </div>
                  );
                })()}

                {/* Siguiente Proyecto */}
                {(() => {
                  const { next } = getNavigationProjects();
                  return next ? (
                    <Link
                      href={`/proyectos/${next.slug}`}
                      className="px-3 text-sm font-medium text-gray-600 hover:text-black text-right"
                    >
                      <div className="flex items-start justify-end gap-1">
                        <div className="text-right">
                          <div className="text-xs text-gray-400 mb-1">
                            {language === 'en' ? 'Next' : 'Siguiente'}
                          </div>
                          <div className="font-medium line-clamp-2">
                            {language === 'en' && next.title_en ? next.title_en : next.title}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-sm">
                          arrow_forward
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <div className="px-3 text-sm font-medium text-gray-300 text-right">
                      <div className="text-xs text-gray-400 mb-1">
                        {language === 'en' ? 'Next' : 'Siguiente'}
                      </div>
                      <div className="text-xs">{language === 'en' ? 'Not available' : 'No disponible'}</div>
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
