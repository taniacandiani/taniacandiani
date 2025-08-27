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

interface Props {
  params: Promise<{ slug: string }>;
}

export default function NoticiaPage({ params }: Props) {
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [relatedNews, setRelatedNews] = useState<NewsItem[]>([]);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    async function loadNews() {
      try {
        const { slug } = await params;
        
        // Initialize with sample news if localStorage is empty
        const storedNews = NewsStorage.getAll();
        if (storedNews.length === 0) {
          NewsStorage.saveAll(SAMPLE_NEWS);
        }

        // Initialize categories
        const storedCategories = NewsCategoryStorage.getAll();
        if (storedCategories.length === 0) {
          NewsCategoryStorage.saveAll(NEWS_CATEGORIES);
        }
        
        // Get all news for sidebar
        const publishedNews = NewsStorage.getPublished();
        setAllNews(publishedNews);
        
        // Update categories count based on current news
        const updatedCategories = NewsCategoryStorage.updateCounts();
        setCategories(updatedCategories);
        
        // Find news item by slug
        const foundNews = NewsStorage.getBySlug(slug) || 
                          SAMPLE_NEWS.find(n => n.slug === slug);
        
        if (!foundNews || foundNews.status !== 'published') {
          notFound();
          return;
        }
        
        setNewsItem(foundNews);
        
        // Get related news (same category, excluding current)
        const related = publishedNews
          .filter(n => n.id !== foundNews.id && n.category === foundNews.category)
          .slice(0, 3);
        setRelatedNews(related);
        
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
    const handleCategoriesUpdate = () => {
      const updatedCategories = NewsCategoryStorage.updateCounts();
      setCategories(updatedCategories);
    };

    window.addEventListener('newsCategoriesUpdated', handleCategoriesUpdate);
    return () => {
      window.removeEventListener('newsCategoriesUpdated', handleCategoriesUpdate);
    };
  }, []);

  // Get available years
  const availableYears = [...new Set(allNews.map(n => new Date(n.publishedAt).getFullYear()))].sort((a, b) => b - a);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando noticia...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!newsItem) {
    return notFound();
  }

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
                        newsItem?.category === category.name
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

          {/* Main Content */}
          <div className={`flex-1 transition-all duration-300 ease-in-out ${
            !sidebarVisible ? '-ml-0' : ''
          }`}>
            {/* Featured Image - FIRST */}
            <div className="relative h-96 w-full mb-8 rounded-lg overflow-hidden">
              <Image
                src={newsItem.image}
                alt={newsItem.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Breadcrumb - SECOND */}
            <div className="mb-8 pb-4 border-b border-gray-200">
              <nav className="text-sm">
                <Link href="/" className="text-gray-500 hover:text-black">
                  Inicio
                </Link>
                <span className="mx-2 text-gray-400">/</span>
                <Link href="/noticias" className="text-gray-500 hover:text-black">
                  Noticias
                </Link>
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-black">{newsItem.title}</span>
              </nav>
            </div>

            <article>
              {/* Header - THIRD: Meta data, title (NO description) */}
              <header className="mb-8">
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                  <time>{formatDate(newsItem.publishedAt)}</time>
                  {newsItem.category && (
                    <>
                      <span>•</span>
                      <span>{newsItem.category}</span>
                    </>
                  )}
                </div>
                <h1 className="text-4xl font-light text-black mb-4 leading-tight">
                  {newsItem.title}
                </h1>
              </header>

              {/* Content - FOURTH */}
              <div className="prose prose-lg max-w-none mb-12">
                <RichContent 
                  content={newsItem.content || newsItem.description} 
                  className="text-black leading-relaxed"
                />
              </div>

              {/* Tags - FIFTH */}
              {newsItem.tags && newsItem.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Etiquetas</h3>
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

            {/* Related News */}
            {relatedNews.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-light text-black mb-6">Noticias relacionadas</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {relatedNews.map((related) => (
                    <Link key={related.id} href={`/noticias/${related.slug}`}>
                      <article className="group">
                        <div className="relative h-48 w-full mb-4 rounded-md overflow-hidden">
                          <Image
                            src={related.image}
                            alt={related.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <time className="text-sm text-gray-500">
                            {formatDate(related.publishedAt)}
                          </time>
                          <h3 className="font-medium text-black group-hover:text-gray-700 transition-colors leading-tight">
                            {related.title}
                          </h3>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
