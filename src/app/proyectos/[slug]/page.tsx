'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [userManuallyToggled, setUserManuallyToggled] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxTouchStart, setLightboxTouchStart] = useState<number | null>(null);
  const [lightboxTouchEnd, setLightboxTouchEnd] = useState<number | null>(null);
  const heroSliderRef = useRef<HTMLDivElement>(null);

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

  // Get localized content with fallback to other language
  const getLocalizedContent = (field: keyof Project, fallback: string = '') => {
    if (!project) return fallback;

    // Primero intentar obtener el contenido en el idioma actual
    if (language === 'en') {
      const enField = `${field}_en` as keyof Project;
      const enValue = project[enField];
      if (enValue && typeof enValue === 'string' && enValue.trim() !== '') {
        return enValue;
      }
      // Si no hay en inglés, usar el español como fallback
      const spanishValue = project[field];
      if (spanishValue && typeof spanishValue === 'string' && spanishValue.trim() !== '') {
        return spanishValue;
      }
    } else {
      // Si el idioma es español
      const spanishValue = project[field];
      if (spanishValue && typeof spanishValue === 'string' && spanishValue.trim() !== '') {
        return spanishValue;
      }
      // Si no hay en español, usar el inglés como fallback
      const enField = `${field}_en` as keyof Project;
      const enValue = project[enField];
      if (enValue && typeof enValue === 'string' && enValue.trim() !== '') {
        return enValue;
      }
    }

    return fallback;
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

  // Lightbox handlers
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };

  const lightboxNext = () => {
    setLightboxIndex((prev) => (prev + 1) % sliderImages.length);
  };

  const lightboxPrev = () => {
    setLightboxIndex((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

  // Minimum swipe distance for touch navigation
  const minSwipeDistance = 50;

  // Lightbox touch handlers
  const onLightboxTouchStart = (e: React.TouchEvent) => {
    setLightboxTouchEnd(null);
    setLightboxTouchStart(e.targetTouches[0].clientX);
  };

  const onLightboxTouchMove = (e: React.TouchEvent) => {
    setLightboxTouchEnd(e.targetTouches[0].clientX);
  };

  const onLightboxTouchEnd = () => {
    if (!lightboxTouchStart || !lightboxTouchEnd) return;

    const distance = lightboxTouchStart - lightboxTouchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      lightboxNext();
    }
    if (isRightSwipe) {
      lightboxPrev();
    }

    setLightboxTouchStart(null);
    setLightboxTouchEnd(null);
  };

  // Touch handlers for slider swipe
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
    // Hacer scroll hacia arriba cuando se cambia de tab del sidebar
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Auto-rotate del slider - pausar cuando hover o lightbox abierto
  useEffect(() => {
    if (sliderImages.length > 1 && !isSliderHovered && !lightboxOpen) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [sliderImages.length, isSliderHovered, lightboxOpen]);

  // Lightbox keyboard navigation and cleanup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;

      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        lightboxNext();
      } else if (e.key === 'ArrowLeft') {
        lightboxPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Cleanup overflow on unmount
      document.body.style.overflow = '';
    };
  }, [lightboxOpen]);

  // Handle manual sidebar toggle
  const handleSidebarToggle = useCallback(() => {
    setSidebarVisible(prev => !prev);
    setUserManuallyToggled(true);
  }, []);

  // Función para manejar click en tabs del proyecto - muestra sidebar si no está visible
  const handleProjectTabClick = useCallback((tabIndex: number) => {
    setActiveProjectTab(tabIndex);
    // Si el sidebar no está visible, mostrarlo
    if (!sidebarVisible) {
      setSidebarVisible(true);
      setUserManuallyToggled(true);
    }
  }, [sidebarVisible]);

  // Abrir sidebar UNA vez cuando el usuario hace scroll hacia abajo (muy sutil)
  useEffect(() => {
    // Si ya está visible o el usuario lo controló manualmente, no hacer nada
    if (sidebarVisible || userManuallyToggled) return;

    // Solo aplicar en desktop
    if (typeof window === 'undefined' || window.innerWidth < 1024) return;

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Si el usuario hizo scroll hacia ABAJO más de 30px desde el inicio
      if (currentScrollY > 30 && currentScrollY > lastScrollY) {
        // Abrir sidebar y dejar de escuchar
        setSidebarVisible(true);
        window.removeEventListener('scroll', handleScroll);
      }

      lastScrollY = currentScrollY;
    };

    // Pequeño delay para asegurar que todo esté listo
    const timeoutId = setTimeout(() => {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sidebarVisible, userManuallyToggled, loading]);

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
          <h1 className="text-2xl font-medium mb-4">
            {getLocalizedContent('title')}
          </h1>

          {/* Tabs del proyecto en mobile */}
          {project.tabs && project.tabs.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setActiveProjectTab(-1)}
                className={`block w-full text-left py-2 px-3 text-sm transition-all duration-200 rounded border border-black ${
                  activeProjectTab === -1
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {getLocalizedContent('title')}
              </button>
              {project.tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveProjectTab(index)}
                  className={`block w-full text-left py-2 px-3 text-sm transition-all duration-200 rounded border border-black ${
                    activeProjectTab === index
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
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
            onClick={handleSidebarToggle}
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
                        onClick={() => handleProjectTabClick(-1)}
                        className={`block w-full text-left py-2 px-3 text-sm transition-all duration-200 rounded border border-black ${
                          activeProjectTab === -1
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                        }`}
                      >
                        {getLocalizedContent('title')}
                      </button>
                      {project.tabs.map((tab, index) => (
                        <button
                          key={tab.id}
                          onClick={() => handleProjectTabClick(index)}
                          className={`block w-full text-left py-2 px-3 text-sm transition-all duration-200 rounded border border-black ${
                            activeProjectTab === index
                              ? 'bg-black text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                          }`}
                        >
                          {language === 'en' ? (tab.title_en || tab.title) : (tab.title || tab.title_en)}
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
                // Verificar qué campos tienen contenido real en cualquier idioma
                const hasCommissioned = (project.commissionedBy && project.commissionedBy.trim() !== '') ||
                                       (project.commissionedBy_en && project.commissionedBy_en.trim() !== '');

                const hasCurator = (project.curator && project.curator.trim() !== '') ||
                                  (project.curator_en && project.curator_en.trim() !== '');

                const hasLocation = (project.location && project.location.trim() !== '') ||
                                   (project.location_en && project.location_en.trim() !== '');

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
                  <div ref={heroSliderRef} className="relative mb-8">
                    <div className={`relative overflow-hidden group ${
                      sidebarVisible ? 'aspect-[4/3] md:aspect-[16/8]' : 'aspect-[4/3] md:aspect-[16/6]'
                    }`} style={{
                      borderRadius: '5px',
                      backgroundColor: (activeProjectTab >= 0 && project.tabs?.[activeProjectTab]?.sliderImagesContain) ||
                                       (!activeProjectTab || activeProjectTab < 0) && project.sliderImagesContain ? 'transparent' : undefined
                    }}>
                      {sliderImages[0] && sliderImages[0].trim() !== '' ? (
                        <button
                          onClick={() => openLightbox(0)}
                          className="absolute inset-0 w-full h-full cursor-pointer focus:outline-none group/zoom"
                          aria-label={language === 'en' ? 'Open image in full screen' : 'Abrir imagen en pantalla completa'}
                        >
                          <Image
                            src={sliderImages[0]}
                            alt={`${project.title} - Imagen principal`}
                            fill
                            className={
                              (activeProjectTab >= 0 && project.tabs?.[activeProjectTab]?.sliderImagesContain) ||
                              (!activeProjectTab || activeProjectTab < 0) && project.sliderImagesContain
                                ? "object-contain"
                                : "object-cover"
                            }
                          />
                          {/* Icono de expandir en hover */}
                          <div className="absolute bottom-3 right-3 opacity-0 group-hover/zoom:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 p-2 rounded-md shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          </div>
                        </button>
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">Sin imagen</span>
                        </div>
                      )}
                    </div>

                    {/* Descripción de la primera imagen si existe */}
                    {(() => {
                      let description: string | undefined;
                      if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
                        const tab = project.tabs[activeProjectTab];
                        // Intentar obtener descripción con fallback
                        const enDesc = tab.heroImageDescriptions_en?.[0];
                        const esDesc = tab.heroImageDescriptions?.[0];

                        if (language === 'en') {
                          description = (enDesc && enDesc.trim() !== '') ? enDesc : esDesc;
                        } else {
                          description = (esDesc && esDesc.trim() !== '') ? esDesc : enDesc;
                        }
                      } else {
                        // Para el proyecto principal
                        const enDesc = project.heroImageDescriptions_en?.[0];
                        const esDesc = project.heroImageDescriptions?.[0];

                        if (language === 'en') {
                          description = (enDesc && enDesc.trim() !== '') ? enDesc : esDesc;
                        } else {
                          description = (esDesc && esDesc.trim() !== '') ? esDesc : enDesc;
                        }
                      }

                      if (description && description.trim() !== '') {
                        return (
                          <div className="mt-2 text-center">
                            <p className="text-black text-sm">
                              {description}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              }

              // Mostrar slider normal si no está configurado sin slider
              return (
                <div ref={heroSliderRef} className="relative mb-8">
                  <div
                    className="relative"
                    onMouseEnter={() => setIsSliderHovered(true)}
                    onMouseLeave={() => setIsSliderHovered(false)}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                  >
                    <div className={`relative overflow-hidden group ${
                      sidebarVisible ? 'aspect-[4/3] md:aspect-[16/8]' : 'aspect-[4/3] md:aspect-[16/6]'
                    }`} style={{
                      borderRadius: '5px',
                      backgroundColor: (activeProjectTab >= 0 && project.tabs?.[activeProjectTab]?.sliderImagesContain) ||
                                       (!activeProjectTab || activeProjectTab < 0) && project.sliderImagesContain ? 'transparent' : undefined
                    }}>
                      {sliderImages[currentSlide] && sliderImages[currentSlide].trim() !== '' ? (
                        <button
                          onClick={() => openLightbox(currentSlide)}
                          className="absolute inset-0 w-full h-full cursor-pointer focus:outline-none group/zoom"
                          aria-label={language === 'en' ? 'Open image in full screen' : 'Abrir imagen en pantalla completa'}
                        >
                          <Image
                            src={optimizeCloudinaryUrl(sliderImages[currentSlide], CLOUDINARY_PRESETS.slider)}
                            alt={`${project.title} - Slide ${currentSlide + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
                            quality={85}
                            loading={currentSlide === 0 ? "eager" : "lazy"}
                            className={
                              (activeProjectTab >= 0 && project.tabs?.[activeProjectTab]?.sliderImagesContain) ||
                              (!activeProjectTab || activeProjectTab < 0) && project.sliderImagesContain
                                ? "object-contain"
                                : "object-cover"
                            }
                          />
                          {/* Icono de expandir en hover - esquina inferior derecha */}
                          <div className="absolute bottom-3 right-3 opacity-0 group-hover/zoom:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 p-2 rounded-md shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          </div>
                        </button>
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">Sin imagen</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Descripción de la imagen actual - fuera del slider */}
                  {(() => {
                    let description: string | undefined;

                    if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
                      const tab = project.tabs[activeProjectTab];
                      // Intentar obtener descripción con fallback
                      const enDesc = tab.heroImageDescriptions_en?.[currentSlide];
                      const esDesc = tab.heroImageDescriptions?.[currentSlide];

                      if (language === 'en') {
                        description = (enDesc && enDesc.trim() !== '') ? enDesc : esDesc;
                      } else {
                        description = (esDesc && esDesc.trim() !== '') ? esDesc : enDesc;
                      }
                    } else {
                      // Para el proyecto principal
                      const enDesc = project.heroImageDescriptions_en?.[currentSlide];
                      const esDesc = project.heroImageDescriptions?.[currentSlide];

                      if (language === 'en') {
                        description = (enDesc && enDesc.trim() !== '') ? enDesc : esDesc;
                      } else {
                        description = (esDesc && esDesc.trim() !== '') ? esDesc : enDesc;
                      }
                    }

                    if (description && description.trim() !== '') {
                      return (
                        <div className="mt-2 text-center">
                          <p className="text-black text-sm">
                            {description}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Navegación del slider - flechas y puntitos debajo de la imagen */}
                  {sliderImages.length > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-4">
                      {/* Flecha izquierda */}
                      <button
                        onClick={prevSlide}
                        className="p-2 rounded-full border border-gray-300 hover:border-black hover:bg-gray-100 transition-all duration-200"
                        aria-label={language === 'en' ? 'Previous image' : 'Imagen anterior'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* Puntitos indicadores */}
                      <div className="flex space-x-2">
                        {sliderImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                              index === currentSlide ? 'bg-black' : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                            aria-label={`${language === 'en' ? 'Go to image' : 'Ir a imagen'} ${index + 1}`}
                          />
                        ))}
                      </div>

                      {/* Flecha derecha */}
                      <button
                        onClick={nextSlide}
                        className="p-2 rounded-full border border-gray-300 hover:border-black hover:bg-gray-100 transition-all duration-200"
                        aria-label={language === 'en' ? 'Next image' : 'Imagen siguiente'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
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
              <h1 className="mb-4" style={{ fontWeight: 500, fontSize: '5rem', lineHeight: 1.1 }}>
                {(() => {
                  // Si hay un tab seleccionado, mostrar el título del tab
                  if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
                    const tab = project.tabs[activeProjectTab];
                    return language === 'en' ? (tab.title_en || tab.title) : (tab.title || tab.title_en);
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
                // Determinar si hay contenido en créditos en CUALQUIERA de los dos idiomas
                let hasCredits = false;
                if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
                  const tab = project.tabs[activeProjectTab];
                  const hasSpanishCredits = !!(tab.credits && tab.credits.trim() !== '');
                  const hasEnglishCredits = !!(tab.credits_en && tab.credits_en.trim() !== '');
                  hasCredits = hasSpanishCredits || hasEnglishCredits;
                } else {
                  const hasSpanishCredits = !!(project.credits && project.credits.trim() !== '');
                  const hasEnglishCredits = !!(project.credits_en && project.credits_en.trim() !== '');
                  hasCredits = hasSpanishCredits || hasEnglishCredits;
                }

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

                // Calcular número de columnas: detalles + (créditos?) + (ficha?) + pdf
                const numCols = 2 + (hasCredits ? 1 : 0) + (hasTechnicalSheet ? 1 : 0);

                return (
                  <div className={`grid grid-cols-${numCols} border-b border-gray-200 mb-6`} style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}>
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
                    {hasCredits && (
                      <button
                        onClick={() => setActiveTab('creditos')}
                        className={`px-3 lg:px-6 py-3 lg:pt-8 lg:pb-6 text-sm lg:text-lg font-medium border-r border-gray-200 ${
                          activeTab === 'creditos'
                            ? 'border-b-2 border-b-black text-black bg-gray-50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {language === 'en' ? 'Credits' : 'Créditos'}
                      </button>
                    )}
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
                          : (tab.projectDetails || tab.projectDetails_en);
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
                                    : (tab.pdfButtonText || tab.pdfButtonText_en || 'Ver Documento')
                                  }
                                </a>
                              </div>
                            )}
                            {/* Video Embeds for tabs - Multiple Videos */}
                            {tab.videoUrls && tab.videoUrls.length > 0 && tab.videoUrls.some(url => url && url.trim() !== '') && (
                              <div className="mt-8 mb-8 space-y-6" style={{ marginLeft: 0, marginRight: 'auto' }}>
                                {tab.videoUrls.filter(url => url && url.trim() !== '').map((videoUrl, videoIndex) => (
                                  <div key={videoIndex}>
                                    {getVideoEmbed(videoUrl)}
                                  </div>
                                ))}
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
                                  : (project.pdfButtonText || project.pdfButtonText_en || 'Ver Documento')
                                }
                              </a>
                            </div>
                          )}
                          {/* Video Embeds - Multiple Videos */}
                          {project.videoUrls && project.videoUrls.length > 0 && project.videoUrls.some(url => url && url.trim() !== '') && (
                            <div className="mt-8 mb-8 space-y-6" style={{ marginLeft: 0, marginRight: 'auto' }}>
                              {project.videoUrls.filter(url => url && url.trim() !== '').map((videoUrl, videoIndex) => (
                                <div key={videoIndex}>
                                  {getVideoEmbed(videoUrl)}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p>{language === 'en' ? 'Project details not available.' : 'Detalles del proyecto no disponibles.'}</p>
                      );
                    })()}
                  </div>
                )}
                {activeTab === 'creditos' && (
                  <div>
                    {(() => {
                      // Si hay un tab seleccionado, mostrar los créditos del tab
                      if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
                        const tab = project.tabs[activeProjectTab];
                        const content = language === 'en'
                          ? (tab.credits_en || tab.credits)
                          : (tab.credits || tab.credits_en);
                        return content ? (
                          <RichContent content={content} />
                        ) : (
                          <p>{language === 'en' ? 'Credits not available.' : 'Créditos no disponibles.'}</p>
                        );
                      }
                      // Si no hay tab seleccionado, mostrar los créditos principales
                      const content = language === 'en'
                        ? (project.credits_en || project.credits)
                        : (project.credits || project.credits_en);
                      return content ? (
                        <RichContent content={content} />
                      ) : (
                        <p>{language === 'en' ? 'Credits not available for this project.' : 'Créditos no disponibles para este proyecto.'}</p>
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
                          : (tab.technicalSheet || tab.technicalSheet_en);
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

                return (
                  <div className="mb-12 space-y-8">
                    {remainingImages.map((image, index) => {
                      const actualIndex = index + 1; // +1 porque empezamos desde la segunda imagen

                      // Obtener descripción con fallback para cada imagen
                      let description: string | undefined;
                      if (activeProjectTab >= 0 && project.tabs && project.tabs[activeProjectTab]) {
                        const tab = project.tabs[activeProjectTab];
                        const enDesc = tab.heroImageDescriptions_en?.[actualIndex];
                        const esDesc = tab.heroImageDescriptions?.[actualIndex];

                        if (language === 'en') {
                          description = (enDesc && enDesc.trim() !== '') ? enDesc : esDesc;
                        } else {
                          description = (esDesc && esDesc.trim() !== '') ? esDesc : enDesc;
                        }
                      } else {
                        const enDesc = project.heroImageDescriptions_en?.[actualIndex];
                        const esDesc = project.heroImageDescriptions?.[actualIndex];

                        if (language === 'en') {
                          description = (enDesc && enDesc.trim() !== '') ? enDesc : esDesc;
                        } else {
                          description = (esDesc && esDesc.trim() !== '') ? esDesc : enDesc;
                        }
                      }

                      return image && image.trim() !== '' ? (
                        <div key={index} className="relative">
                          <div className="relative flex flex-col items-center group">
                            <button
                              onClick={() => openLightbox(actualIndex)}
                              className="cursor-pointer focus:outline-none relative group/zoom"
                              aria-label={language === 'en' ? 'Open image in full screen' : 'Abrir imagen en pantalla completa'}
                            >
                              <img
                                src={image}
                                alt={`${project.title} - Imagen ${actualIndex + 1}`}
                                className="h-auto"
                                style={{ width: 'auto', maxWidth: '100%', display: 'block', borderRadius: '5px' }}
                              />
                              {/* Icono de expandir en hover */}
                              <div className="absolute bottom-3 right-3 opacity-0 group-hover/zoom:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 p-2 rounded-md shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                              </div>
                            </button>
                            {description && description.trim() !== '' && (
                              <div className="mt-2 text-sm text-gray-600 text-center w-full">
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
                            {language === 'en' ? (previous.title_en || previous.title) : (previous.title || previous.title_en)}
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
                            {language === 'en' ? (next.title_en || next.title) : (next.title || next.title_en)}
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
                            {language === 'en' ? (previous.title_en || previous.title) : (previous.title || previous.title_en)}
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
                            {language === 'en' ? (next.title_en || next.title) : (next.title || next.title_en)}
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

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Botón cerrar */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-[10000] text-white hover:text-gray-300 transition-colors p-2"
            aria-label={language === 'en' ? 'Close' : 'Cerrar'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Contador de imágenes */}
          {sliderImages.length > 1 && (
            <div className="absolute top-4 left-4 z-[10000] text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
              {lightboxIndex + 1} / {sliderImages.length}
            </div>
          )}

          {/* Imagen con soporte touch */}
          <div
            className="relative w-full h-full flex items-center justify-center p-4 md:p-12"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onLightboxTouchStart}
            onTouchMove={onLightboxTouchMove}
            onTouchEnd={onLightboxTouchEnd}
          >
            {sliderImages[lightboxIndex] && (
              <img
                src={sliderImages[lightboxIndex]}
                alt={`${project.title} - ${language === 'en' ? 'Image' : 'Imagen'} ${lightboxIndex + 1}`}
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
            )}
          </div>

          {/* Navegación - solo si hay múltiples imágenes */}
          {sliderImages.length > 1 && (
            <>
              {/* Flecha izquierda */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  lightboxPrev();
                }}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-[10000] text-white hover:text-gray-300 transition-colors p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
                aria-label={language === 'en' ? 'Previous image' : 'Imagen anterior'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Flecha derecha */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  lightboxNext();
                }}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-[10000] text-white hover:text-gray-300 transition-colors p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
                aria-label={language === 'en' ? 'Next image' : 'Siguiente imagen'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Instrucciones para móvil - swipe */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[10000] text-white text-xs opacity-50 md:hidden">
            {language === 'en' ? 'Swipe to navigate' : 'Desliza para navegar'}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
