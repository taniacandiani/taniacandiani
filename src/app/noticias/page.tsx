'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MainLayout from '@/components/MainLayout';
import { NewsItem } from '@/types';
import { NewsStorage } from '@/lib/newsStorage';
import { NewsCategoryStorage } from '@/lib/newsCategoryStorage';
import { NewsCategory } from '@/types';
import { NEWS_CATEGORIES } from '@/data/content';
import { SAMPLE_NEWS } from '@/data/content';
import RichContent from '@/components/ui/RichContent';
import { generateNewsExcerpt } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

function NoticiasContent() {
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [userManuallyToggled, setUserManuallyToggled] = useState(false);
  const [categoriesAccordionOpen, setCategoriesAccordionOpen] = useState(false);
  const [yearAccordionOpen, setYearAccordionOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Migrar noticias existentes a múltiples categorías
        await NewsStorage.migrateToMultipleCategories();
        
        // Initialize with sample news if storage is empty
        const storedNews = await NewsStorage.getAll();
        if (storedNews.length === 0) {
          // Note: saveAll is not implemented in the new async version
          // We'll rely on the JSON files for now
          console.log('Using default news from content.ts');
          setNews(SAMPLE_NEWS);
        } else {
          setNews(storedNews);
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
      } catch (error) {
        console.error('Error initializing data:', error);
        // Fallback to static content
        setNews(SAMPLE_NEWS);
        setCategories(NEWS_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    const publishedNews = news.filter(n => n.status === 'published');
    setFilteredNews(publishedNews);

    // Update categories with counts
    const updateCategoryCounts = async () => {
      try {
        const updatedCategories = await NewsCategoryStorage.updateCounts();
        setCategories(updatedCategories);
      } catch (error) {
        console.error('Error updating category counts:', error);
      }
    };

    updateCategoryCounts();
  }, [news]);

  // Initialize filters from URL params
  useEffect(() => {
    const category = searchParams.get('category');
    const year = searchParams.get('year');
    const search = searchParams.get('search');
    
    setSelectedCategory(category || null);
    setSelectedYear(year ? parseInt(year) : null);
    setSearchTerm(search || '');
  }, [searchParams]);

  useEffect(() => {
    let filtered = news.filter(n => n.status === 'published');

    if (searchTerm) {
      filtered = filtered.filter(n => {
        // Search in both Spanish and English content
        const titleToSearch = language === 'en' && n.titleEn ? n.titleEn : n.title;
        const contentToSearch = language === 'en' && n.contentEn ? n.contentEn : n.content;

        return titleToSearch.toLowerCase().includes(searchTerm.toLowerCase()) ||
               contentToSearch.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (selectedCategory) {
      filtered = filtered.filter(n => n.categories?.includes(selectedCategory));
    }

    if (selectedYear) {
      filtered = filtered.filter(n => new Date(n.publishedAt).getFullYear() === selectedYear);
    }

    setFilteredNews(filtered);
  }, [searchTerm, selectedCategory, selectedYear, news, language]);

  // Listen for news updates from admin
  useEffect(() => {
    const handleNewsUpdate = async () => {
      try {
        const updatedNews = await NewsStorage.getAll();
        setNews(updatedNews);
      } catch (error) {
        console.error('Error updating news:', error);
      }
    };

    const handleCategoriesUpdate = async () => {
      try {
        const updatedCategories = await NewsCategoryStorage.updateCounts();
        setCategories(updatedCategories);
      } catch (error) {
        console.error('Error updating categories:', error);
      }
    };

    window.addEventListener('newsUpdated', handleNewsUpdate);
    window.addEventListener('newsCategoriesUpdated', handleCategoriesUpdate);
    return () => {
      window.removeEventListener('newsUpdated', handleNewsUpdate);
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
  const availableYears = useMemo(() => {
    if (!Array.isArray(news)) return [];

    const years = [...new Set(news.filter(n => n.status === 'published').map(n => new Date(n.publishedAt).getFullYear()))];
    return years.sort((a, b) => b - a);
  }, [news]);

  const updateFilter = (updates: { category?: string | null; year?: number | null; search?: string }) => {
    const params = new URLSearchParams(searchParams);
    
    if (updates.category !== undefined) {
      if (updates.category) {
        params.set('category', updates.category);
      } else {
        params.delete('category');
      }
      setSelectedCategory(updates.category);
    }
    
    if (updates.year !== undefined) {
      if (updates.year) {
        params.set('year', updates.year.toString());
      } else {
        params.delete('year');
      }
      setSelectedYear(updates.year);
    }
    
    if (updates.search !== undefined) {
      if (updates.search) {
        params.set('search', updates.search);
      } else {
        params.delete('search');
      }
      setSearchTerm(updates.search);
    }
    
    router.push(`/noticias?${params.toString()}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container-mobile py-8 pt-16">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-mobile py-4 lg:py-8 pt-8 lg:pt-24">
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


        {/* Mobile Filters - Acordeones arriba */}
        <div className="lg:hidden mb-8 space-y-4">
          {/* Búsqueda - siempre visible */}
          <div className="pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder={language === 'en' ? 'Search news...' : 'Buscar noticias...'}
                value={searchTerm}
                onChange={(e) => updateFilter({ search: e.target.value })}
                className="w-full border-0 border-b border-gray-300 pl-0 pr-7 py-2 text-base bg-transparent placeholder-black"
              />
              <svg
                className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Categorías Accordion */}
          <div className="border-b border-gray-300">
            <button
              onClick={() => setCategoriesAccordionOpen(!categoriesAccordionOpen)}
              className="w-full flex justify-between items-center py-3 text-left"
            >
              <h4 className="text-lg font-medium">{language === 'en' ? 'Categories' : 'Categorías'}</h4>
              <svg
                className={`w-5 h-5 transition-transform ${categoriesAccordionOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {categoriesAccordionOpen && (
              <div className="pb-4 space-y-2">
                <button
                  onClick={() => updateFilter({ category: null })}
                  className={`block w-full text-left py-1 text-base ${
                    selectedCategory === null ? 'text-black font-medium' : 'text-gray-500'
                  }`}
                >
                  {language === 'en' ? 'All categories' : 'Todas las categorías'}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => updateFilter({ category: category.name })}
                    className={`block w-full text-left py-1 text-base ${
                      selectedCategory === category.name ? 'text-black font-medium' : 'text-gray-500'
                    }`}
                  >
                    {language === 'en' && category.nameEn ? category.nameEn : category.name} ({category.count})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Año Accordion */}
          <div className="border-b border-gray-300">
            <button
              onClick={() => setYearAccordionOpen(!yearAccordionOpen)}
              className="w-full flex justify-between items-center py-3 text-left"
            >
              <h4 className="text-lg font-medium">{language === 'en' ? 'Year' : 'Año'}</h4>
              <svg
                className={`w-5 h-5 transition-transform ${yearAccordionOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {yearAccordionOpen && (
              <div className="pb-4 space-y-2">
                <button
                  onClick={() => updateFilter({ year: null })}
                  className={`block w-full text-left py-1 text-base ${
                    selectedYear === null ? 'text-black font-medium' : 'text-gray-500'
                  }`}
                >
                  {language === 'en' ? 'All years' : 'Todos los años'}
                </button>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => updateFilter({ year })}
                    className={`block w-full text-left py-1 text-base ${
                      selectedYear === year ? 'text-black font-medium' : 'text-gray-500'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`flex ${sidebarVisible ? 'gap-8' : 'gap-0'} transition-all duration-300 ease-in-out`}>
          {/* Desktop Sidebar Fixed */}
          <div className={`hidden lg:block fixed left-8 transition-all duration-300 ease-in-out ${
            sidebarVisible ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'
          }`} style={{ top: '240px', maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', overflowX: 'hidden' }}>
            <div className="w-64 pr-4 overflow-x-hidden">
              {/* Búsqueda */}
              <div className="mb-8">
                <div className="relative">
                  <svg
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder={language === 'en' ? 'Search news...' : 'Buscar noticias...'}
                    value={searchTerm}
                    onChange={(e) => updateFilter({ search: e.target.value })}
                    className="w-full border-0 border-b border-gray-300 pl-7 pr-0 py-2 text-base bg-transparent placeholder-black"
                  />
                </div>
              </div>

              {/* Categorías */}
              <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
                <h4 className="projects-h4 text-lg font-normal mb-4">{language === 'en' ? 'Categories' : 'Categorías'}</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => updateFilter({ category: null })}
                    className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                      selectedCategory === null
                        ? 'text-black'
                        : 'text-gray-500 hover:text-black'
                    }`}
                    aria-pressed={selectedCategory === null}
                  >
                    {language === 'en' ? 'All categories' : 'Todas las categorías'}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => updateFilter({ category: category.name })}
                      className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                        selectedCategory === category.name
                          ? 'text-black'
                          : 'text-gray-500 hover:text-black'
                      }`}
                      aria-pressed={selectedCategory === category.name}
                    >
                      {language === 'en' && category.nameEn ? category.nameEn : category.name} ({category.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Años */}
              <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
                <h4 className="projects-h4 text-lg font-normal mb-4">{language === 'en' ? 'Year' : 'Año'}</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => updateFilter({ year: null })}
                    className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                      selectedYear === null
                        ? 'text-black'
                        : 'text-gray-500 hover:text-black'
                    }`}
                    aria-pressed={selectedYear === null}
                  >
                    {language === 'en' ? 'All years' : 'Todos los años'}
                  </button>
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => updateFilter({ year })}
                      className={`block w-full text-left py-1 text-base transition-all duration-200 ${
                        selectedYear === year
                          ? 'text-black'
                          : 'text-gray-500 hover:text-black'
                      }`}
                      aria-pressed={selectedYear === year}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Espaciador para sidebar fixed cuando está visible */}
          <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ease-in-out ${
            sidebarVisible ? 'w-64' : 'w-0'
          }`}></div>

          {/* Grid de noticias */}
          <div className={`flex-1 transition-all duration-300 ease-in-out ${
            !sidebarVisible ? '-ml-0' : ''
          }`}>
            
            {filteredNews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">{language === 'en' ? 'No news found.' : 'No se encontraron noticias.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredNews.map((newsItem) => (
                  <article key={newsItem.id} className="group">
                    <Link href={`/noticias/${newsItem.slug}`}>
                      <div className="space-y-4">
                        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-md">
                          <Image
                            src={newsItem.image}
                            alt={language === 'en' && newsItem.titleEn ? newsItem.titleEn : newsItem.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <time>{formatDate(newsItem.createdAt || newsItem.publishedAt)}</time>
                            {newsItem.categories && newsItem.categories.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{newsItem.categories.map(catName => {
                                  const cat = categories.find(c => c.name === catName);
                                  return language === 'en' && cat?.nameEn ? cat.nameEn : catName;
                                }).join(', ')}</span>
                              </>
                            )}
                          </div>
                          <h2 className="text-xl font-medium text-black group-hover:text-gray-700 transition-colors">
                            {language === 'en' && newsItem.titleEn ? newsItem.titleEn : newsItem.title}
                          </h2>
                          <div
                            className="text-black text-sm leading-relaxed"
                          >
                            {generateNewsExcerpt(
                              language === 'en' && newsItem.contentEn ? newsItem.contentEn : newsItem.content,
                              150
                            )}
                          </div>
                          <div className="pt-2">
                            <span className="text-black text-sm group-hover:underline">
                              {language === 'en' ? 'Read more →' : 'Leer más →'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function NoticiasPageFallback() {
  const { language } = useLanguage();
  return (
    <MainLayout>
      <div className="container-mobile py-8 pt-16">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function NoticiasPage() {
  return (
    <Suspense fallback={<NoticiasPageFallback />}>
      <NoticiasContent />
    </Suspense>
  );
}
