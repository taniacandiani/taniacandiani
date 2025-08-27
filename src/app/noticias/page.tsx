'use client';

import { useState, useEffect, useMemo } from 'react';
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

export default function NoticiasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    // Migrar noticias existentes a múltiples categorías
    NewsStorage.migrateToMultipleCategories();
    
    // Initialize with sample news if localStorage is empty
    const storedNews = NewsStorage.getAll();
    if (storedNews.length === 0) {
      NewsStorage.saveAll(SAMPLE_NEWS);
      setNews(SAMPLE_NEWS);
    } else {
      setNews(storedNews);
    }

    // Initialize categories
    const storedCategories = NewsCategoryStorage.getAll();
    if (storedCategories.length === 0) {
      NewsCategoryStorage.saveAll(NEWS_CATEGORIES);
    }
  }, []);

  useEffect(() => {
    const publishedNews = news.filter(n => n.status === 'published');
    setFilteredNews(publishedNews);

    // Update categories with counts
    const updatedCategories = NewsCategoryStorage.updateCounts();
    setCategories(updatedCategories);
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
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(n => n.categories?.includes(selectedCategory));
    }

    if (selectedYear) {
      filtered = filtered.filter(n => new Date(n.publishedAt).getFullYear() === selectedYear);
    }

    setFilteredNews(filtered);
  }, [searchTerm, selectedCategory, selectedYear, news]);

  // Listen for news updates from admin
  useEffect(() => {
    const handleNewsUpdate = () => {
      const updatedNews = NewsStorage.getAll();
      setNews(updatedNews);
    };

    const handleCategoriesUpdate = () => {
      const updatedCategories = NewsCategoryStorage.updateCounts();
      setCategories(updatedCategories);
    };

    window.addEventListener('newsUpdated', handleNewsUpdate);
    window.addEventListener('newsCategoriesUpdated', handleCategoriesUpdate);
    return () => {
      window.removeEventListener('newsUpdated', handleNewsUpdate);
      window.removeEventListener('newsCategoriesUpdated', handleCategoriesUpdate);
    };
  }, []);

  // Get available years
  const availableYears = useMemo(() => {
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
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <MainLayout>
      <div className="container-mobile py-8 pt-16">
        {/* Header con Toggle Button y Título alineados */}
        <div className="mb-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-center cursor-pointer"
              aria-label={sidebarVisible ? "Ocultar sidebar" : "Mostrar sidebar"}
            >
              <span 
                className="material-symbols-outlined leading-none -mt-1" 
                style={{ fontSize: '32px' }}
              >
                thumbnail_bar
              </span>
            </button>
            <h1 className="text-2xl md:text-4xl font-medium tracking-widest text-black">NOTICIAS</h1>
          </div>
        </div>

        <div className={`flex ${sidebarVisible ? 'gap-8' : 'gap-0'} transition-all duration-300 ease-in-out`}>
          {/* Sidebar */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            sidebarVisible ? 'w-64' : 'w-0'
          }`}>
            <div className="w-64">
              
              {/* Búsqueda */}
              <div className="mb-8">
                <h4 className="projects-h4 text-lg font-normal mb-4">Búsqueda</h4>
                <input
                  type="text"
                  placeholder="Buscar noticias..."
                  value={searchTerm}
                  onChange={(e) => updateFilter({ search: e.target.value })}
                  className="w-full border-0 border-b border-gray-300 px-0 py-2 text-base bg-transparent"
                  aria-label="Buscar noticias por título, categoría o descripción"
                />
              </div>

              {/* Categorías */}
              <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
                <h4 className="projects-h4 text-lg font-normal mb-4">Categorías</h4>
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
                    Todas las categorías
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
                      {category.name} ({category.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Años */}
              <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
                <h4 className="projects-h4 text-lg font-normal mb-4">Año</h4>
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
                    Todos los años
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

          {/* Grid de noticias */}
          <div className={`flex-1 transition-all duration-300 ease-in-out ${
            !sidebarVisible ? '-ml-0' : ''
          }`}>
            
            {filteredNews.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No se encontraron noticias.</p>
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
                            alt={newsItem.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <time>{formatDate(newsItem.publishedAt)}</time>
                            {newsItem.categories && newsItem.categories.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{newsItem.categories.join(', ')}</span>
                              </>
                            )}
                          </div>
                          <h2 className="text-xl font-medium text-black group-hover:text-gray-700 transition-colors">
                            {newsItem.title}
                          </h2>
                          <div 
                            className="text-black text-sm leading-relaxed"
                          >
                            {generateNewsExcerpt(newsItem.content, 150)}
                          </div>
                          <div className="pt-2">
                            <span className="text-black text-sm group-hover:underline">
                              Leer más →
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
