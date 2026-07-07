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
import { generateNewsExcerpt, normalizeSearch } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { CardGridSkeleton } from '@/components/ui/PageSkeletons';

function getInitialNoticiasFilters() {
  const defaults = { searchTerm: '', selectedCategory: null as string | null, selectedYear: null as number | null, sortBy: 'date' as 'date' | 'title' | 'category' };
  if (typeof window === 'undefined') return defaults;
  try {
    const prevPath = sessionStorage.getItem('prev-path') || '';
    const comingFromSameSection = prevPath.startsWith('/noticias/');

    if (comingFromSameSection) {
      const saved = sessionStorage.getItem('filters-noticias');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          searchTerm: '', // Always reset search
          selectedCategory: parsed.selectedCategory || null,
          selectedYear: parsed.selectedYear ?? null,
          sortBy: (parsed.sortBy || 'date') as 'date' | 'title' | 'category'
        };
      }
    } else {
      sessionStorage.removeItem('filters-noticias');
    }
  } catch { /* ignore */ }
  return defaults;
}

function NoticiasContent() {
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilters = getInitialNoticiasFilters();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialFilters.selectedCategory);
  const [selectedYear, setSelectedYear] = useState<number | null>(initialFilters.selectedYear);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [userManuallyToggled, setUserManuallyToggled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'category'>(initialFilters.sortBy);
  const [activeAccordion, setActiveAccordion] = useState<'categories' | 'year' | 'sort' | null>(null);

  // Restaurar posición de scroll cuando el contenido esté listo
  useScrollRestoration('noticias', !loading);

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

  // Override filters from URL params if present (e.g. direct/shared link)
  useEffect(() => {
    const category = searchParams.get('category');
    const year = searchParams.get('year');
    const search = searchParams.get('search');
    const hasUrlParams = category || year || search;

    if (hasUrlParams) {
      setSelectedCategory(category || null);
      setSelectedYear(year ? parseInt(year) : null);
      setSearchTerm(search || '');
    }
  }, [searchParams]);

  // Save filter state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem('filters-noticias', JSON.stringify({
        selectedCategory, selectedYear, searchTerm, sortBy
      }));
    } catch {
      // ignore storage errors
    }
  }, [selectedCategory, selectedYear, searchTerm, sortBy]);

  useEffect(() => {
    let filtered = news.filter(n => n.status === 'published');

    if (searchTerm) {
      const searchNorm = normalizeSearch(searchTerm);
      filtered = filtered.filter(n => {
        // Search in both Spanish and English content (accent-insensitive)
        const titleToSearch = language === 'en' && n.titleEn ? n.titleEn : n.title;
        const contentToSearch = language === 'en' && n.contentEn ? n.contentEn : n.content;

        return normalizeSearch(titleToSearch).includes(searchNorm) ||
               normalizeSearch(contentToSearch).includes(searchNorm);
      });
    }

    if (selectedCategory) {
      filtered = filtered.filter(n => n.categories?.includes(selectedCategory));
    }

    if (selectedYear) {
      filtered = filtered.filter(n => new Date(n.createdAt || n.publishedAt).getFullYear() === selectedYear);
    }

    // Ordenar
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.createdAt || a.publishedAt).getTime();
        const dateB = new Date(b.createdAt || b.publishedAt).getTime();
        return dateB - dateA;
      } else if (sortBy === 'category') {
        const catA = a.categories?.[0] || '';
        const catB = b.categories?.[0] || '';
        return catA.localeCompare(catB);
      } else {
        const titleA = language === 'en' && a.titleEn ? a.titleEn : a.title;
        const titleB = language === 'en' && b.titleEn ? b.titleEn : b.title;
        return titleA.localeCompare(titleB);
      }
    });

    setFilteredNews(filtered);
  }, [searchTerm, selectedCategory, selectedYear, news, language, sortBy]);

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

    const years = [...new Set(news.filter(n => n.status === 'published').map(n => new Date(n.createdAt || n.publishedAt).getFullYear()))];
    return years.sort((a, b) => b - a);
  }, [news]);

  // Detectar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return selectedCategory !== null || selectedYear !== null || sortBy !== 'date';
  }, [selectedCategory, selectedYear, sortBy]);

  // Contar filtros activos
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== null) count++;
    if (selectedYear !== null) count++;
    if (sortBy !== 'date') count++;
    return count;
  }, [selectedCategory, selectedYear, sortBy]);

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedYear(null);
    setSortBy('date');
    router.push('/noticias');
  };

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
        <CardGridSkeleton />
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
            className="relative flex p-1 bg-white hover:bg-gray-100 rounded-md transition-colors items-center justify-center cursor-pointer shadow-lg border border-gray-200"
            aria-label={sidebarVisible ? "Ocultar sidebar" : "Mostrar sidebar"}
          >
            <span
              className="material-symbols-outlined leading-none -mt-1"
              style={{ fontSize: '32px' }}
            >
              thumbnail_bar
            </span>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-black rounded-full"></span>
            )}
          </button>
        </div>


        {/* Mobile Filters - Acordeones arriba */}
        <div className="lg:hidden mb-8 space-y-4">
          {/* Botón limpiar filtros mobile */}
          {hasActiveFilters && (
            <div className="pb-2">
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors group"
              >
                <span className="material-symbols-outlined text-base group-hover:text-red-500 transition-colors">
                  filter_alt_off
                </span>
                <span>{language === 'en' ? 'Clear filters' : 'Limpiar filtros'}</span>
                <span className="bg-black text-white text-xs px-1.5 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              </button>
            </div>
          )}

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

          {/* Ordenar Accordion - Mobile */}
          <div className="border-b border-gray-300">
            <button
              onClick={() => setActiveAccordion(activeAccordion === 'sort' ? null : 'sort')}
              className="w-full flex justify-between items-center py-3 text-left"
            >
              <h4 className="text-lg font-medium flex items-center gap-2">
                {sortBy === 'date' && (language === 'en' ? 'Order by date' : 'Orden por fecha')}
                {sortBy === 'title' && (language === 'en' ? 'Order by name' : 'Orden por nombre')}
                {sortBy === 'category' && (language === 'en' ? 'Order by category' : 'Orden por categoría')}
                {sortBy !== 'date' && (
                  <span className="w-2 h-2 bg-black rounded-full"></span>
                )}
              </h4>
              <svg
                className={`w-5 h-5 transition-transform ${activeAccordion === 'sort' ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeAccordion === 'sort' && (
              <div className="pb-4 space-y-2">
                <button
                  onClick={() => {
                    setSortBy('date');
                    setActiveAccordion(null);
                  }}
                  className={`flex items-center gap-2 w-full text-left py-1 text-base ${
                    sortBy === 'date' ? 'text-black font-medium' : 'text-gray-500'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm w-5">
                    {sortBy === 'date' ? 'check' : ''}
                  </span>
                  {language === 'en' ? 'Order by date' : 'Orden por fecha'}
                </button>
                <button
                  onClick={() => {
                    setSortBy('title');
                    setActiveAccordion(null);
                  }}
                  className={`flex items-center gap-2 w-full text-left py-1 text-base ${
                    sortBy === 'title' ? 'text-black font-medium' : 'text-gray-500'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm w-5">
                    {sortBy === 'title' ? 'check' : ''}
                  </span>
                  {language === 'en' ? 'Order by name' : 'Orden por nombre'}
                </button>
                <button
                  onClick={() => {
                    setSortBy('category');
                    setActiveAccordion(null);
                  }}
                  className={`flex items-center gap-2 w-full text-left py-1 text-base ${
                    sortBy === 'category' ? 'text-black font-medium' : 'text-gray-500'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm w-5">
                    {sortBy === 'category' ? 'check' : ''}
                  </span>
                  {language === 'en' ? 'Order by category' : 'Orden por categoría'}
                </button>
              </div>
            )}
          </div>

          {/* Categorías Accordion */}
          <div className="border-b border-gray-300">
            <button
              onClick={() => setActiveAccordion(activeAccordion === 'categories' ? null : 'categories')}
              className="w-full flex justify-between items-center py-3 text-left"
            >
              <h4 className="text-lg font-medium flex items-center gap-2">
                {language === 'en' ? 'Categories' : 'Categorías'}
                {selectedCategory && (
                  <span className="w-2 h-2 bg-black rounded-full"></span>
                )}
              </h4>
              <svg
                className={`w-5 h-5 transition-transform ${activeAccordion === 'categories' ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeAccordion === 'categories' && (
              <div className="pb-4 space-y-2">
                <button
                  onClick={() => updateFilter({ category: null })}
                  className={`flex items-center gap-2 w-full text-left py-1 text-base ${
                    selectedCategory === null ? 'text-black font-medium' : 'text-gray-500'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm w-5">
                    {selectedCategory === null ? 'check' : ''}
                  </span>
                  {language === 'en' ? 'All categories' : 'Todas las categorías'}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => updateFilter({ category: category.name })}
                    className={`flex items-center gap-2 w-full text-left py-1 text-base ${
                      selectedCategory === category.name ? 'text-black font-medium' : 'text-gray-500'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm w-5">
                      {selectedCategory === category.name ? 'check' : ''}
                    </span>
                    {language === 'en' && category.nameEn ? category.nameEn : category.name} ({category.count})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Año Accordion */}
          <div className="border-b border-gray-300">
            <button
              onClick={() => setActiveAccordion(activeAccordion === 'year' ? null : 'year')}
              className="w-full flex justify-between items-center py-3 text-left"
            >
              <h4 className="text-lg font-medium flex items-center gap-2">
                {language === 'en' ? 'Year' : 'Año'}
                {selectedYear && (
                  <span className="w-2 h-2 bg-black rounded-full"></span>
                )}
              </h4>
              <svg
                className={`w-5 h-5 transition-transform ${activeAccordion === 'year' ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeAccordion === 'year' && (
              <div className="pb-4 space-y-2">
                <button
                  onClick={() => updateFilter({ year: null })}
                  className={`flex items-center gap-2 w-full text-left py-1 text-base ${
                    selectedYear === null ? 'text-black font-medium' : 'text-gray-500'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm w-5">
                    {selectedYear === null ? 'check' : ''}
                  </span>
                  {language === 'en' ? 'All years' : 'Todos los años'}
                </button>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => updateFilter({ year })}
                    className={`flex items-center gap-2 w-full text-left py-1 text-base ${
                      selectedYear === year ? 'text-black font-medium' : 'text-gray-500'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm w-5">
                      {selectedYear === year ? 'check' : ''}
                    </span>
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
              {/* Botón limpiar filtros desktop */}
              {hasActiveFilters && (
                <div className="mb-4">
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors group"
                  >
                    <span className="material-symbols-outlined text-base group-hover:text-red-500 transition-colors">
                      filter_alt_off
                    </span>
                    <span>{language === 'en' ? 'Clear filters' : 'Limpiar filtros'}</span>
                    <span className="bg-black text-white text-xs px-1.5 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  </button>
                </div>
              )}

              {/* Búsqueda */}
              <div className="mb-8">
                <div className="relative">
                  <svg
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-8 text-black"
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
                    className="w-full border-0 border-b border-gray-300 pl-7 pr-0 pb-3 pt-1 text-base bg-transparent placeholder-black"
                  />
                </div>
              </div>

              {/* Ordenar - Acordeón */}
              <div className="mb-8 pb-3 border-b border-[#E6E0E0]">
                <button
                  onClick={() => setActiveAccordion(activeAccordion === 'sort' ? null : 'sort')}
                  className="w-full flex justify-between items-center text-lg font-normal hover:text-gray-700"
                >
                  <span className="flex items-center gap-2">
                    {sortBy === 'date' && (language === 'en' ? 'Order by date' : 'Orden por fecha')}
                    {sortBy === 'title' && (language === 'en' ? 'Order by name' : 'Orden por nombre')}
                    {sortBy === 'category' && (language === 'en' ? 'Order by category' : 'Orden por categoría')}
                    {sortBy !== 'date' && (
                      <span className="w-2 h-2 bg-black rounded-full"></span>
                    )}
                  </span>
                  <span className="material-symbols-outlined text-base">
                    {activeAccordion === 'sort' ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                <div className={`space-y-2 overflow-hidden transition-all duration-300 ${
                  activeAccordion === 'sort' ? 'max-h-[500px]' : 'max-h-0'
                }`}>
                  <button
                    onClick={() => {
                      setSortBy('date');
                      setActiveAccordion(null);
                    }}
                    className={`flex items-center gap-2 w-full text-left py-1 text-base transition-all duration-200 ${
                      sortBy === 'date' ? 'text-black' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm w-5">
                      {sortBy === 'date' ? 'check' : ''}
                    </span>
                    {language === 'en' ? 'Order by date' : 'Orden por fecha'}
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('title');
                      setActiveAccordion(null);
                    }}
                    className={`flex items-center gap-2 w-full text-left py-1 text-base transition-all duration-200 ${
                      sortBy === 'title' ? 'text-black' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm w-5">
                      {sortBy === 'title' ? 'check' : ''}
                    </span>
                    {language === 'en' ? 'Order by name' : 'Orden por nombre'}
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('category');
                      setActiveAccordion(null);
                    }}
                    className={`flex items-center gap-2 w-full text-left py-1 text-base transition-all duration-200 ${
                      sortBy === 'category' ? 'text-black' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm w-5">
                      {sortBy === 'category' ? 'check' : ''}
                    </span>
                    {language === 'en' ? 'Order by category' : 'Orden por categoría'}
                  </button>
                </div>
              </div>

              {/* Categorías - Acordeón */}
              <div className="mb-8 pb-3 border-b border-[#E6E0E0]">
                <button
                  onClick={() => setActiveAccordion(activeAccordion === 'categories' ? null : 'categories')}
                  className="w-full flex justify-between items-center text-lg font-normal hover:text-gray-700"
                >
                  <span className="flex items-center gap-2">
                    {language === 'en' ? 'Categories' : 'Categorías'}
                    {selectedCategory && (
                      <span className="w-2 h-2 bg-black rounded-full"></span>
                    )}
                  </span>
                  <span className="material-symbols-outlined text-base">
                    {activeAccordion === 'categories' ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                <div className={`space-y-2 overflow-hidden transition-all duration-300 ${
                  activeAccordion === 'categories' ? 'max-h-[800px]' : 'max-h-0'
                }`}>
                  <button
                    onClick={() => updateFilter({ category: null })}
                    className={`flex items-center gap-2 w-full text-left py-1 text-base transition-all duration-200 ${
                      selectedCategory === null ? 'text-black' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm w-5">
                      {selectedCategory === null ? 'check' : ''}
                    </span>
                    {language === 'en' ? 'All categories' : 'Todas las categorías'}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => updateFilter({ category: category.name })}
                      className={`flex items-center gap-2 w-full text-left py-1 text-base transition-all duration-200 ${
                        selectedCategory === category.name ? 'text-black' : 'text-gray-500 hover:text-black'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm w-5">
                        {selectedCategory === category.name ? 'check' : ''}
                      </span>
                      {language === 'en' && category.nameEn ? category.nameEn : category.name} ({category.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Años - Acordeón */}
              <div className="mb-8 pb-3 border-b border-[#E6E0E0]">
                <button
                  onClick={() => setActiveAccordion(activeAccordion === 'year' ? null : 'year')}
                  className="w-full flex justify-between items-center text-lg font-normal hover:text-gray-700"
                >
                  <span className="flex items-center gap-2">
                    {language === 'en' ? 'Year' : 'Año'}
                    {selectedYear && (
                      <span className="w-2 h-2 bg-black rounded-full"></span>
                    )}
                  </span>
                  <span className="material-symbols-outlined text-base">
                    {activeAccordion === 'year' ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                <div className={`space-y-2 overflow-hidden transition-all duration-300 ${
                  activeAccordion === 'year' ? 'max-h-[800px]' : 'max-h-0'
                }`}>
                  <button
                    onClick={() => updateFilter({ year: null })}
                    className={`flex items-center gap-2 w-full text-left py-1 text-base transition-all duration-200 ${
                      selectedYear === null ? 'text-black' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm w-5">
                      {selectedYear === null ? 'check' : ''}
                    </span>
                    {language === 'en' ? 'All years' : 'Todos los años'}
                  </button>
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => updateFilter({ year })}
                      className={`flex items-center gap-2 w-full text-left py-1 text-base transition-all duration-200 ${
                        selectedYear === year ? 'text-black' : 'text-gray-500 hover:text-black'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm w-5">
                        {selectedYear === year ? 'check' : ''}
                      </span>
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
      <CardGridSkeleton />
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
