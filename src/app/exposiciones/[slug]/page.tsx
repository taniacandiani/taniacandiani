'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MainLayout from '@/components/MainLayout';
import RichContent from '@/components/ui/RichContent';
import { Exhibition } from '@/types';
import { ExhibitionStorage } from '@/lib/exhibitionStorage';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ExhibitionDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { language } = useLanguage();
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchExhibition = async () => {
      try {
        setLoading(true);
        const data = await ExhibitionStorage.getBySlug(slug);
        if (!data) {
          notFound();
        }
        setExhibition(data);
      } catch (error) {
        console.error('Error fetching exhibition:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchExhibition();
    }
  }, [slug]);

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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!exhibition) {
    notFound();
  }

  return (
    <MainLayout>
      <article className="container-mobile py-8 pt-16">
        {/* Breadcrumb */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/exposiciones" className="text-gray-600 hover:text-black transition-colors">
                {language === 'en' ? 'Exhibitions' : 'Exposiciones'}
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-black">
              {language === 'en' && exhibition.titleEn ? exhibition.titleEn : exhibition.title}
            </li>
          </ol>
        </nav>

        {/* Hero Image Slider */}
        {exhibition.heroImages && exhibition.heroImages.length > 0 ? (
          <div className="mb-12 relative">
            <div className="relative aspect-[16/7] max-h-[500px] w-full overflow-hidden rounded-lg bg-gray-100" style={{ backgroundColor: exhibition.heroImageContain ? 'transparent' : undefined }}>
              <Image
                src={exhibition.heroImages[currentSlide]}
                alt={`${language === 'en' && exhibition.titleEn ? exhibition.titleEn : exhibition.title} - Image ${currentSlide + 1}`}
                fill
                className={exhibition.heroImageContain ? "object-contain" : "object-cover"}
                priority
              />

              {/* Navigation Arrows */}
              {exhibition.heroImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + exhibition.heroImages!.length) % exhibition.heroImages!.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % exhibition.heroImages!.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Dots indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {exhibition.heroImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : exhibition.image ? (
          <div className="mb-12 relative aspect-[16/7] max-h-[500px] w-full overflow-hidden rounded-lg bg-gray-100" style={{ backgroundColor: exhibition.heroImageContain ? 'transparent' : undefined }}>
            <Image
              src={exhibition.image}
              alt={language === 'en' && exhibition.titleEn ? exhibition.titleEn : exhibition.title}
              fill
              className={exhibition.heroImageContain ? "object-contain" : "object-cover"}
              priority
            />
          </div>
        ) : null}

        {/* Exhibition Details */}
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-medium mb-6 text-black">
            {language === 'en' && exhibition.titleEn ? exhibition.titleEn : exhibition.title}
          </h1>

          {/* Meta Information */}
          <div className="mb-8 space-y-3">
            {/* Dates */}
            {exhibition.startDate && (
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">
                  {language === 'en' ? 'Date' : 'Fecha'}:
                </span>
                <time>{formatDate(exhibition.startDate)}</time>
                {exhibition.endDate && (
                  <>
                    <span>-</span>
                    <time>{formatDate(exhibition.endDate)}</time>
                  </>
                )}
              </div>
            )}

            {/* Venue */}
            {exhibition.venue && (
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">
                  {language === 'en' ? 'Venue' : 'Lugar'}:
                </span>
                <span>
                  {language === 'en' && exhibition.venueEn ? exhibition.venueEn : exhibition.venue}
                </span>
              </div>
            )}

            {/* Categories */}
            {exhibition.categories && exhibition.categories.length > 0 && (
              <div className="flex items-center gap-2">
                {exhibition.categories.map((category, index) => (
                  <span
                    key={index}
                    className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}

            {/* External Link Button */}
            {exhibition.externalLink && (
              <div className="mt-4">
                <a
                  href={exhibition.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {language === 'en' ? 'Visit Exhibition Website' : 'Visitar Sitio de la Exposición'}
                </a>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <RichContent content={
              language === 'en' && exhibition.contentEn ? exhibition.contentEn : exhibition.content
            } />
          </div>

          {/* Tags */}
          {exhibition.tags && exhibition.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-3">
                {language === 'en' ? 'Tags' : 'Etiquetas'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {exhibition.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Back to exhibitions button */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/exposiciones"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="rotate-180"
              >
                <path
                  d="M7.5 5L12.5 10L7.5 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {language === 'en' ? 'Back to exhibitions' : 'Volver a exposiciones'}
            </Link>
          </div>
        </div>
      </article>
    </MainLayout>
  );
}