'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import MainLayout from '@/components/MainLayout';
import { NewsItem, NewsCategory } from '@/types';
import { NewsStorage } from '@/lib/newsStorage';
import { NewsCategoryStorage } from '@/lib/newsCategoryStorage';
import { NEWS_CATEGORIES, SAMPLE_NEWS } from '@/data/content';
import RichContent from '@/components/ui/RichContent';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function NoticiaPage({ params }: Props) {
  const { language } = useLanguage();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [userManuallyToggled, setUserManuallyToggled] = useState(false);

  useEffect(() => {
    async function loadNews() {
      try {
        const { slug } = await params;
        
        // Initialize with sample news if storage is empty
        const storedNews = await NewsStorage.getAll();
        if (storedNews.length === 0) {
          // Note: saveAll is not implemented in the new async version
          // We'll rely on the JSON files for now
          console.log('Using default news from content.ts');
        }

        // Initialize categories
        const storedCategories = await NewsCategoryStorage.getAll();
        if (storedCategories.length === 0) {
          // Note: saveAll is not implemented in the new async version
          // We'll rely on the JSON files for now
          console.log('Using default categories from content.ts');
          setCategories(NEWS_CATEGORIES);
        } else {
          setCategories(storedCategories);
        }
        
        // Get all news for sidebar
        const publishedNews = await NewsStorage.getPublished();
        setAllNews(publishedNews);
        
        // Update categories count based on current news
        const updatedCategories = await NewsCategoryStorage.updateCounts();
        setCategories(updatedCategories);
        
        // Find news item by slug
        const foundNews = await NewsStorage.getBySlug(slug) || 
                          SAMPLE_NEWS.find(n => n.slug === slug);
        
        if (!foundNews || foundNews.status !== 'published') {
          notFound();
          return;
        }
        
        setNewsItem(foundNews);
        

        
      } catch (error) {
        console.error('Error loading news:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }

    loadNews();
  }, [params]);

  // Listen for categories updates from admin
  useEffect(() => {
    const handleCategoriesUpdate = async () => {
      try {
        const updatedCategories = await NewsCategoryStorage.updateCounts();
        setCategories(updatedCategories);
      } catch (error) {
        console.error('Error updating categories:', error);
      }
    };

    window.addEventListener('newsCategoriesUpdated', handleCategoriesUpdate);
    return () => {
      window.removeEventListener('newsCategoriesUpdated', handleCategoriesUpdate);
    };
  }, []);

  // Abrir sidebar UNA vez cuando el usuario hace scroll hacia abajo (solo desktop)
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

  // Handle manual sidebar toggle
  const handleSidebarToggle = () => {
    setSidebarVisible(prev => !prev);
    setUserManuallyToggled(true);
  };

  // Get available years
  const availableYears = [...new Set(allNews.map(n => new Date(n.publishedAt).getFullYear()))].sort((a, b) => b - a);

  // Get previous and next news for navigation
  const getNavigationNews = () => {
    if (!newsItem || allNews.length === 0) return { previous: null, next: null };
    
    const currentIndex = allNews.findIndex(n => n.id === newsItem.id);
    if (currentIndex === -1) return { previous: null, next: null };
    
    const previous = currentIndex > 0 ? allNews[currentIndex - 1] : null;
    const next = currentIndex < allNews.length - 1 ? allNews[currentIndex + 1] : null;
    
    return { previous, next };
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!newsItem) {
    return notFound();
  }

  // Use English content if available and language is 'en'
  const title = language === 'en' && newsItem.titleEn ? newsItem.titleEn : newsItem.title;
  const content = language === 'en' && newsItem.contentEn ? newsItem.contentEn : newsItem.content;

  return (
    <MainLayout>
      <div className="container-mobile py-4 lg:py-8 pt-8 lg:pt-24">
        {/* Mobile: Breadcrumb al inicio */}
        <div className="lg:hidden mb-4 pb-4 border-b border-gray-200">
          <nav className="text-sm">
            <Link href="/" className="text-gray-500 hover:text-black">
              {language === 'en' ? 'Home' : 'Inicio'}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/noticias" className="text-gray-500 hover:text-black">
              {language === 'en' ? 'News' : 'Noticias'}
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-black">{title}</span>
          </nav>
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
          {/* Sidebar Fixed - Solo desktop */}
          <div className={`hidden lg:block fixed left-8 transition-all duration-300 ease-in-out ${
            sidebarVisible ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'
          }`} style={{ top: '240px', maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', overflowX: 'hidden' }}>
            <div className="w-64 pr-4 overflow-x-hidden">
              {/* Categorías */}
              <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
                <h4 className="projects-h4 text-lg font-normal mb-4">Categorías</h4>
                <div className="space-y-2">
                  <Link
                    href="/noticias"
                    className={`block w-full text-left py-1 text-base transition-all duration-200 text-gray-500 hover:text-black`}
                  >
                    Todas las categorías
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/noticias?category=${encodeURIComponent(category.name)}`}
                      className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                        newsItem?.categories?.includes(category.name)
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
                    href="/noticias"
                    className={`block w-full text-left py-1 text-base transition-all duration-200 text-gray-500 hover:text-black`}
                  >
                    Todos los años
                  </Link>
                  {availableYears.map((year) => (
                    <Link
                      key={year}
                      href={`/noticias?year=${year}`}
                      className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                        newsItem && new Date(newsItem.publishedAt).getFullYear() === year
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

          {/* Espaciador para sidebar fixed cuando está visible */}
          <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ease-in-out ${
            sidebarVisible ? 'w-64' : 'w-0'
          }`}></div>

          {/* Main Content */}
          <div className={`flex-1 transition-all duration-300 ease-in-out ${
            !sidebarVisible ? '-ml-0' : ''
          }`}>
            {/* Featured Image - FIRST */}
            <div className={`relative h-96 w-full mb-8 rounded-lg overflow-hidden ${newsItem.heroImageContain ? 'bg-transparent' : ''}`}>
              <Image
                src={newsItem.image}
                alt={title}
                fill
                className={newsItem.heroImageContain ? "object-contain" : "object-cover"}
                priority
              />
            </div>

            {/* Breadcrumb - Solo desktop */}
            <div className="hidden lg:block mb-8 pb-4 border-b border-gray-200">
              <nav className="text-sm">
                <Link href="/" className="text-gray-500 hover:text-black">
                  {language === 'en' ? 'Home' : 'Inicio'}
                </Link>
                <span className="mx-2 text-gray-400">/</span>
                <Link href="/noticias" className="text-gray-500 hover:text-black">
                  {language === 'en' ? 'News' : 'Noticias'}
                </Link>
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-black">{title}</span>
              </nav>
            </div>

            <article>
              {/* Header - THIRD: Meta data, title (NO description) */}
              <header className="mb-8">
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                  <time>{formatDate(newsItem.publishedAt)}</time>
                  {newsItem.categories && newsItem.categories.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{newsItem.categories.join(', ')}</span>
                    </>
                  )}
                </div>
                <h1 className="text-4xl font-light text-black mb-4 leading-tight">
                  {title}
                </h1>
              </header>

              {/* Content - FOURTH */}
              <div className="prose prose-lg max-w-none mb-12">
                <RichContent
                  content={content}
                  className="text-black leading-relaxed"
                />
              </div>

              {/* Tags - FIFTH */}
              {newsItem.tags && newsItem.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    {language === 'en' ? 'Tags' : 'Etiquetas'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {newsItem.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Navegación inferior */}
            <div className="border-t border-gray-200">
              <div className="grid grid-cols-2 pt-6 lg:pt-8">
                {/* Noticia Anterior */}
                {(() => {
                  const { previous } = getNavigationNews();
                  return previous ? (
                    <Link
                      href={`/noticias/${previous.slug}`}
                      className="px-3 lg:px-6 text-sm lg:text-lg font-medium text-gray-600 hover:text-black border-r border-gray-200 text-left group"
                    >
                      <div className="flex items-start lg:items-center gap-1 lg:gap-2">
                        <span className="material-symbols-outlined text-sm lg:group-hover:-translate-x-1 transition-transform">
                          arrow_back
                        </span>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">
                            {language === 'en' ? 'Previous' : 'Anterior'}
                          </div>
                          <div className="font-medium line-clamp-2">
                            {language === 'en' && previous.titleEn ? previous.titleEn : previous.title}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="px-3 lg:px-6 text-sm lg:text-lg font-medium text-gray-300 border-r border-gray-200 text-left">
                      <div className="text-xs text-gray-400 mb-1">
                        {language === 'en' ? 'Previous' : 'Anterior'}
                      </div>
                      <div className="text-xs lg:text-base">{language === 'en' ? 'Not available' : 'No disponible'}</div>
                    </div>
                  );
                })()}

                {/* Siguiente Noticia */}
                {(() => {
                  const { next } = getNavigationNews();
                  return next ? (
                    <Link
                      href={`/noticias/${next.slug}`}
                      className="px-3 lg:px-6 text-sm lg:text-lg font-medium text-gray-600 hover:text-black text-right group"
                    >
                      <div className="flex items-start lg:items-center justify-end gap-1 lg:gap-2">
                        <div className="text-right">
                          <div className="text-xs text-gray-400 mb-1">
                            {language === 'en' ? 'Next' : 'Siguiente'}
                          </div>
                          <div className="font-medium line-clamp-2">
                            {language === 'en' && next.titleEn ? next.titleEn : next.title}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-sm lg:group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <div className="px-3 lg:px-6 text-sm lg:text-lg font-medium text-gray-300 text-right">
                      <div className="text-xs text-gray-400 mb-1">
                        {language === 'en' ? 'Next' : 'Siguiente'}
                      </div>
                      <div className="text-xs lg:text-base">{language === 'en' ? 'Not available' : 'No disponible'}</div>
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
