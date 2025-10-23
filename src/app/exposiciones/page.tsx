'use client';

import { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MainLayout from '@/components/MainLayout';
import { Exhibition, ExhibitionCategory } from '@/types';
import { ExhibitionStorage } from '@/lib/exhibitionStorage';
import { ExhibitionCategoryStorage } from '@/lib/exhibitionCategoryStorage';
import { generateNewsExcerpt } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

type SortOption = 'date' | 'title' | 'category';

function ExposicionesContent() {
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [filteredExhibitions, setFilteredExhibitions] = useState<Exhibition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>('Activas'); // Default to "Activas"
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [categories, setCategories] = useState<ExhibitionCategory[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [categoriesAccordionOpen, setCategoriesAccordionOpen] = useState(false);
  const [yearAccordionOpen, setYearAccordionOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        // Migrate exhibitions if needed
        await ExhibitionStorage.migrateToMultipleCategories();

        // Get all exhibitions
        const storedExhibitions = await ExhibitionStorage.getAll();
        setExhibitions(storedExhibitions);

        // Get categories and update counts
        const storedCategories = await ExhibitionCategoryStorage.getAll();

        // Update category counts based on current exhibitions
        const updatedCategories = await ExhibitionCategoryStorage.updateCounts();
        setCategories(updatedCategories);
      } catch (error) {
        console.error('Error initializing data:', error);
        setExhibitions([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize filters from URL params
  useEffect(() => {
    const category = searchParams.get('category');
    const year = searchParams.get('year');
    const search = searchParams.get('search');

    setSelectedCategory(category || 'Activas'); // Default to "Activas" if no category
    setSelectedYear(year ? parseInt(year) : null);
    setSearchTerm(search || '');
  }, [searchParams]);

  // Filter and sort exhibitions
  useEffect(() => {
    let filtered = exhibitions.filter(e => e.status === 'published');

    if (searchTerm) {
      filtered = filtered.filter(e => {
        const titleToSearch = language === 'en' && e.titleEn ? e.titleEn : e.title;
        const contentToSearch = language === 'en' && e.contentEn ? e.contentEn : e.content;

        return titleToSearch.toLowerCase().includes(searchTerm.toLowerCase()) ||
               contentToSearch.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (selectedCategory) {
      filtered = filtered.filter(e => e.categories?.includes(selectedCategory));
    }

    if (selectedYear) {
      filtered = filtered.filter(e => {
        const startYear = e.startDate ? new Date(e.startDate).getFullYear() : null;
        const publishedYear = new Date(e.publishedAt).getFullYear();
        return startYear === selectedYear || publishedYear === selectedYear;
      });
    }

    // Sort exhibitions
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = a.startDate || a.publishedAt;
        const dateB = b.startDate || b.publishedAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
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

    setFilteredExhibitions(filtered);
  }, [searchTerm, selectedCategory, selectedYear, exhibitions, language, sortBy]);

  // Listen for exhibition updates from admin
  useEffect(() => {
    const handleExhibitionUpdate = async () => {
      try {
        const updatedExhibitions = await ExhibitionStorage.getAll();
        setExhibitions(updatedExhibitions);
      } catch (error) {
        console.error('Error updating exhibitions:', error);
      }
    };

    const handleCategoriesUpdate = async () => {
      try {
        const updatedCategories = await ExhibitionCategoryStorage.updateCounts();
        setCategories(updatedCategories);
      } catch (error) {
        console.error('Error updating categories:', error);
      }
    };

    window.addEventListener('exhibitionsUpdated', handleExhibitionUpdate);
    window.addEventListener('exhibitionCategoriesUpdated', handleCategoriesUpdate);
    return () => {
      window.removeEventListener('exhibitionsUpdated', handleExhibitionUpdate);
      window.removeEventListener('exhibitionCategoriesUpdated', handleCategoriesUpdate);
    };
  }, []);

  // Get available years
  const availableYears = useMemo(() => {
    if (!Array.isArray(exhibitions)) return [];

    const years = new Set<number>();
    exhibitions.filter(e => e.status === 'published').forEach(e => {
      if (e.startDate) {
        years.add(new Date(e.startDate).getFullYear());
      } else {
        years.add(new Date(e.publishedAt).getFullYear());
      }
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [exhibitions]);

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

    router.push(`/exposiciones?${params.toString()}`);
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
      <div className="container-mobile py-4 lg:py-8 pt-8 lg:pt-16">
        {/* Header */}
        <div className="mb-8 lg:mb-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Toggle sidebar button - solo desktop */}
            <button
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="hidden lg:flex p-1 hover:bg-gray-100 rounded-md transition-colors items-center justify-center cursor-pointer"
              aria-label={sidebarVisible ? "Ocultar sidebar" : "Mostrar sidebar"}
            >
              <span
                className="material-symbols-outlined leading-none -mt-1"
                style={{ fontSize: '32px' }}
              >
                thumbnail_bar
              </span>
            </button>
            <h1 className="text-2xl md:text-4xl font-medium tracking-widest text-black">
              {language === 'en' ? 'EXHIBITIONS' : 'EXPOSICIONES'}
            </h1>
          </div>

          {/* Sorting dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <span>
                {sortBy === 'date' && (language === 'en' ? 'Order by date' : 'Orden por fecha')}
                {sortBy === 'title' && (language === 'en' ? 'Order by name' : 'Orden por nombre')}
                {sortBy === 'category' && (language === 'en' ? 'Order by category' : 'Orden por categoría')}
              </span>
              <svg
                width="12"
                height="8"
                viewBox="0 0 12 8"
                fill="none"
                className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              >
                <path
                  d="M1 1L6 6L11 1"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 bg-black text-white rounded-sm shadow-lg z-50 min-w-[160px]">
                <button
                  onClick={() => {
                    setSortBy('date');
                    setDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-800 transition-colors ${
                    sortBy === 'date' ? 'bg-gray-800' : ''
                  }`}
                >
                  {language === 'en' ? 'Order by date' : 'Orden por fecha'}
                </button>
                <button
                  onClick={() => {
                    setSortBy('title');
                    setDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-800 transition-colors ${
                    sortBy === 'title' ? 'bg-gray-800' : ''
                  }`}
                >
                  {language === 'en' ? 'Order by name' : 'Orden por nombre'}
                </button>
                <button
                  onClick={() => {
                    setSortBy('category');
                    setDropdownOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-800 transition-colors ${
                    sortBy === 'category' ? 'bg-gray-800' : ''
                  }`}
                >
                  {language === 'en' ? 'Order by category' : 'Orden por categoría'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filters - Acordeones arriba */}
        <div className="lg:hidden mb-8 space-y-4">
          {/* Búsqueda - siempre visible */}
          <div className="pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder={language === 'en' ? 'Search exhibitions...' : 'Buscar exposiciones...'}
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
          {/* Desktop Sidebar */}
          <div className={`hidden lg:block transition-all duration-300 ease-in-out overflow-hidden ${
            sidebarVisible ? 'w-64' : 'w-0'
          }`}>
            <div className="w-64">
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
                    placeholder={language === 'en' ? 'Search exhibitions...' : 'Buscar exposiciones...'}
                    value={searchTerm}
                    onChange={(e) => updateFilter({ search: e.target.value })}
                    className="w-full border-0 border-b border-gray-300 pl-7 pr-0 py-2 text-base bg-transparent placeholder-black"
                  />
                </div>
              </div>

              {/* Categories */}
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

              {/* Years */}
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

          {/* Exhibition grid */}
          <div className={`flex-1 transition-all duration-300 ease-in-out ${
            !sidebarVisible ? '-ml-0' : ''
          }`}>

            {filteredExhibitions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {language === 'en' ? 'No exhibitions found.' : 'No se encontraron exposiciones.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredExhibitions.map((exhibition) => (
                  <article key={exhibition.id} className="group">
                    <Link href={`/exposiciones/${exhibition.slug}`}>
                      <div className="space-y-4">
                        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-md">
                          <Image
                            src={exhibition.image || '/placeholder-image.jpg'}
                            alt={language === 'en' && exhibition.titleEn ? exhibition.titleEn : exhibition.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            {exhibition.startDate && (
                              <>
                                <time>{formatDate(exhibition.startDate)}</time>
                                {exhibition.endDate && (
                                  <>
                                    <span>-</span>
                                    <time>{formatDate(exhibition.endDate)}</time>
                                  </>
                                )}
                              </>
                            )}
                            {!exhibition.startDate && (
                              <time>{formatDate(exhibition.publishedAt)}</time>
                            )}
                          </div>
                          {exhibition.venue && (
                            <p className="text-sm text-gray-600">
                              {language === 'en' && exhibition.venueEn ? exhibition.venueEn : exhibition.venue}
                            </p>
                          )}
                          <h2 className="text-xl font-medium text-black group-hover:text-gray-700 transition-colors">
                            {language === 'en' && exhibition.titleEn ? exhibition.titleEn : exhibition.title}
                          </h2>
                          {exhibition.curator && (
                            <p className="text-sm text-gray-600">
                              {language === 'en' ? 'Curated by' : 'Curado por'}: {
                                language === 'en' && exhibition.curatorEn ? exhibition.curatorEn : exhibition.curator
                              }
                            </p>
                          )}
                          <div className="text-black text-sm leading-relaxed">
                            {generateNewsExcerpt(
                              language === 'en' && exhibition.contentEn ? exhibition.contentEn : exhibition.content,
                              150
                            )}
                          </div>
                          <div className="pt-2">
                            <span className="text-black text-sm group-hover:underline">
                              {language === 'en' ? 'View more →' : 'Ver más →'}
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

function ExposicionesPageFallback() {
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

export default function ExposicionesPage() {
  return (
    <Suspense fallback={<ExposicionesPageFallback />}>
      <ExposicionesContent />
    </Suspense>
  );
}