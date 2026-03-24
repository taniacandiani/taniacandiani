'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { normalizeSearch } from '@/lib/utils';
import { ProjectStorage } from '@/lib/projectStorage';
import { NewsStorage } from '@/lib/newsStorage';
import { ExhibitionStorage } from '@/lib/exhibitionStorage';
import { Project, NewsItem, Exhibition } from '@/types';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_RESULTS_PER_SECTION = 5;

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const { language } = useLanguage();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lazy load data when modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (dataLoaded) {
      // Focus input when reopening
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [p, n, e] = await Promise.all([
          ProjectStorage.getAll(),
          NewsStorage.getAll(),
          ExhibitionStorage.getAll(),
        ]);
        setProjects(p.filter(x => x.status === 'published'));
        setNews(n.filter(x => x.status === 'published'));
        setExhibitions(e.filter(x => x.status === 'published'));
        setDataLoaded(true);
      } catch (err) {
        console.error('Error loading search data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, dataLoaded]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset search on close
  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  const navigateTo = useCallback((path: string) => {
    onClose();
    router.push(path);
  }, [onClose, router]);

  // Filter results
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const norm = normalizeSearch(searchTerm);
    return projects.filter(p => {
      const title = language === 'en' && p.title_en ? p.title_en : p.title;
      return normalizeSearch(title).includes(norm) ||
        normalizeSearch(p.description || '').includes(norm) ||
        p.categories?.some(c => normalizeSearch(c).includes(norm)) ||
        p.tags?.some(t => normalizeSearch(t).includes(norm));
    }).slice(0, MAX_RESULTS_PER_SECTION);
  }, [searchTerm, projects, language]);

  const filteredNews = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const norm = normalizeSearch(searchTerm);
    return news.filter(n => {
      const title = language === 'en' && n.titleEn ? n.titleEn : n.title;
      return normalizeSearch(title).includes(norm);
    }).slice(0, MAX_RESULTS_PER_SECTION);
  }, [searchTerm, news, language]);

  const filteredExhibitions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const norm = normalizeSearch(searchTerm);
    return exhibitions.filter(e => {
      const title = language === 'en' && e.titleEn ? e.titleEn : e.title;
      return normalizeSearch(title).includes(norm);
    }).slice(0, MAX_RESULTS_PER_SECTION);
  }, [searchTerm, exhibitions, language]);

  const totalResults = filteredProjects.length + filteredNews.length + filteredExhibitions.length;
  const hasSearch = searchTerm.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4 animate-fadeIn"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[75vh] flex flex-col overflow-hidden animate-slideDown">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'en' ? 'Search projects, exhibitions, news...' : 'Buscar proyectos, exposiciones, noticias...'}
            className="flex-1 text-lg outline-none bg-transparent placeholder-gray-400"
            autoComplete="off"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm border border-gray-300 rounded px-2 py-0.5 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {loading && (
            <div className="text-center text-gray-400 py-8">
              {language === 'en' ? 'Loading...' : 'Cargando...'}
            </div>
          )}

          {!loading && !hasSearch && (
            <div className="text-center text-gray-400 py-8 text-sm">
              {language === 'en'
                ? 'Type to search across all content'
                : 'Escribe para buscar en todo el contenido'}
            </div>
          )}

          {!loading && hasSearch && totalResults === 0 && (
            <div className="text-center text-gray-400 py-8 text-sm">
              {language === 'en'
                ? `No results for "${searchTerm}"`
                : `Sin resultados para "${searchTerm}"`}
            </div>
          )}

          {/* Projects */}
          {filteredProjects.length > 0 && (
            <ResultSection
              title={language === 'en' ? 'PROJECTS' : 'PROYECTOS'}
              onViewAll={() => navigateTo(`/proyectos?search=${encodeURIComponent(searchTerm)}`)}
              viewAllLabel={language === 'en' ? 'View all' : 'Ver todos'}
              showViewAll={filteredProjects.length === MAX_RESULTS_PER_SECTION}
            >
              {filteredProjects.map(p => (
                <ResultItem
                  key={p.id}
                  title={language === 'en' && p.title_en ? p.title_en : p.title}
                  meta={`${p.year}`}
                  category={p.categories?.[0]}
                  onClick={() => navigateTo(`/proyectos/${p.slug}`)}
                />
              ))}
            </ResultSection>
          )}

          {/* Exhibitions */}
          {filteredExhibitions.length > 0 && (
            <ResultSection
              title={language === 'en' ? 'EXHIBITIONS' : 'EXPOSICIONES'}
              onViewAll={() => navigateTo(`/exposiciones?search=${encodeURIComponent(searchTerm)}`)}
              viewAllLabel={language === 'en' ? 'View all' : 'Ver todos'}
              showViewAll={filteredExhibitions.length === MAX_RESULTS_PER_SECTION}
            >
              {filteredExhibitions.map(e => {
                const year = e.startDate
                  ? new Date(e.startDate).getFullYear()
                  : new Date(e.publishedAt).getFullYear();
                return (
                  <ResultItem
                    key={e.id}
                    title={language === 'en' && e.titleEn ? e.titleEn : e.title}
                    meta={`${year}`}
                    category={e.categories?.[0]}
                    onClick={() => navigateTo(`/exposiciones/${e.slug}`)}
                  />
                );
              })}
            </ResultSection>
          )}

          {/* News */}
          {filteredNews.length > 0 && (
            <ResultSection
              title={language === 'en' ? 'NEWS' : 'NOTICIAS'}
              onViewAll={() => navigateTo(`/noticias?search=${encodeURIComponent(searchTerm)}`)}
              viewAllLabel={language === 'en' ? 'View all' : 'Ver todos'}
              showViewAll={filteredNews.length === MAX_RESULTS_PER_SECTION}
            >
              {filteredNews.map(n => {
                const year = new Date(n.publishedAt).getFullYear();
                return (
                  <ResultItem
                    key={n.id}
                    title={language === 'en' && n.titleEn ? n.titleEn : n.title}
                    meta={`${year}`}
                    category={n.categories?.[0]}
                    onClick={() => navigateTo(`/noticias/${n.slug}`)}
                  />
                );
              })}
            </ResultSection>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

// --- Sub-components ---

function ResultSection({
  title,
  children,
  onViewAll,
  viewAllLabel,
  showViewAll,
}: {
  title: string;
  children: React.ReactNode;
  onViewAll: () => void;
  viewAllLabel: string;
  showViewAll: boolean;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium tracking-widest text-gray-400">{title}</h3>
        {showViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-gray-400 hover:text-black transition-colors"
          >
            {viewAllLabel} →
          </button>
        )}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function ResultItem({
  title,
  meta,
  category,
  onClick,
}: {
  title: string;
  meta: string;
  category?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left group cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-normal text-gray-900 truncate group-hover:text-black">
          {title}
        </div>
      </div>
      {category && (
        <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:inline">{category}</span>
      )}
      <span className="text-xs text-gray-400 flex-shrink-0">{meta}</span>
      <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
