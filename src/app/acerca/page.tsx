'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MainLayout from '@/components/MainLayout';
import Section from '@/components/Section';
import { AboutContent, Publication } from '@/types';
import { PublicationStorage } from '@/lib/publicationStorage';
import { SAMPLE_PUBLICATIONS } from '@/data/content';
import RichContent from '@/components/ui/RichContent';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AcercaPage() {
  const { language } = useLanguage();
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Initialize about content from API
        const aboutResponse = await fetch('/api/about');
        if (aboutResponse.ok) {
          const aboutData = await aboutResponse.json();
          console.log('Contenido de Acerca cargado desde API:', aboutData);
          setAboutContent(aboutData);
        } else {
          console.log('No se pudo cargar el contenido de Acerca desde la API');
          setAboutContent(null);
        }

        // Initialize publications
        const storedPublications = await PublicationStorage.getAll();
        if (storedPublications.length === 0) {
          // Note: saveAll is not implemented in the new async version
          // We'll rely on the JSON files for now
          console.log('Using default publications from content.ts');
          setPublications(SAMPLE_PUBLICATIONS);
        } else {
          const publishedPublications = await PublicationStorage.getPublished();
          setPublications(publishedPublications);
        }
      } catch (error) {
        console.error('Error loading about data:', error);
        setAboutContent(null);
        setPublications(SAMPLE_PUBLICATIONS);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Listen for updates from admin
  useEffect(() => {
    const handleAboutUpdate = async () => {
      try {
        const aboutResponse = await fetch('/api/about');
        if (aboutResponse.ok) {
          const aboutData = await aboutResponse.json();
          setAboutContent(aboutData);
        }
      } catch (error) {
        console.error('Error updating about content:', error);
      }
    };

    const handlePublicationsUpdate = async () => {
      try {
        const updatedPublications = await PublicationStorage.getPublished();
        setPublications(updatedPublications);
      } catch (error) {
        console.error('Error updating publications:', error);
      }
    };

    window.addEventListener('aboutUpdated', handleAboutUpdate);
    window.addEventListener('publicationsUpdated', handlePublicationsUpdate);

    return () => {
      window.removeEventListener('aboutUpdated', handleAboutUpdate);
      window.removeEventListener('publicationsUpdated', handlePublicationsUpdate);
    };
  }, []);

  return (
    <MainLayout>
      <style jsx global>{`
        .publication-description p {
          text-align: justify;
          margin-bottom: 1em;
        }
        .publication-description p:last-child {
          margin-bottom: 0;
        }
      `}</style>
      <div className="container-mobile py-8 pt-16">
        {aboutContent && (
          <>
            {/* Title */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-4xl font-medium tracking-widest text-black">
                {language === 'en' && aboutContent.title_en ? aboutContent.title_en : aboutContent.title}
              </h1>
            </div>

            {/* About Content */}
            <div className="prose prose-lg max-w-3xl mb-12">
              <RichContent
                content={language === 'en' && aboutContent.content_en ? aboutContent.content_en : aboutContent.content}
                className="text-black leading-relaxed"
              />
            </div>

            {/* PDF Download Buttons */}
            {(aboutContent.cv_pdf || aboutContent.bio_pdf || aboutContent.portfolio_pdf ||
              aboutContent.cv_pdf_en || aboutContent.bio_pdf_en || aboutContent.portfolio_pdf_en) && (
              <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-12">
                {(language === 'en' ? aboutContent.cv_pdf_en : aboutContent.cv_pdf) && (
                  <a
                    href={language === 'en' ? aboutContent.cv_pdf_en : aboutContent.cv_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded-md"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {(language === 'en' ? aboutContent.cv_button_text_en : aboutContent.cv_button_text) ||
                     (language === 'en' ? 'Download CV' : 'Descargar CV')}
                  </a>
                )}

                {(language === 'en' ? aboutContent.bio_pdf_en : aboutContent.bio_pdf) && (
                  <a
                    href={language === 'en' ? aboutContent.bio_pdf_en : aboutContent.bio_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded-md"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {(language === 'en' ? aboutContent.bio_button_text_en : aboutContent.bio_button_text) ||
                     (language === 'en' ? 'Download Bio' : 'Descargar Bio')}
                  </a>
                )}

                {(language === 'en' ? aboutContent.portfolio_pdf_en : aboutContent.portfolio_pdf) && (
                  <a
                    href={language === 'en' ? aboutContent.portfolio_pdf_en : aboutContent.portfolio_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded-md"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {(language === 'en' ? aboutContent.portfolio_button_text_en : aboutContent.portfolio_button_text) ||
                     (language === 'en' ? 'Download Portfolio' : 'Descargar Portfolio')}
                  </a>
                )}
              </div>
            )}

            {/* Additional Section */}
            {(aboutContent.additional_title || aboutContent.additional_content ||
              aboutContent.additional_title_en || aboutContent.additional_content_en) && (
              <div className="mb-20">
                {(aboutContent.additional_title || aboutContent.additional_title_en) && (
                  <h2 className="text-2xl md:text-3xl font-medium text-black mb-6">
                    {language === 'en' && aboutContent.additional_title_en
                      ? aboutContent.additional_title_en
                      : aboutContent.additional_title}
                  </h2>
                )}

                {(aboutContent.additional_content || aboutContent.additional_content_en) && (
                  <div className="prose prose-lg max-w-3xl">
                    <RichContent
                      content={language === 'en' && aboutContent.additional_content_en
                        ? aboutContent.additional_content_en
                        : aboutContent.additional_content || ''}
                      className="text-black leading-relaxed"
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Publications Section */}
        <div className="mt-20">
            <h2 className="text-2xl md:text-4xl font-medium tracking-widest text-black mb-12">
              {language === 'en' ? 'PUBLICATIONS' : 'PUBLICACIONES'}
            </h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                
              </div>
            ) : publications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {publications.map((publication) => (
                  <div key={publication.id} className="group flex flex-col h-full">
                    <div className="flex flex-col flex-1 space-y-4">
                      {/* Thumbnail */}
                      <Link
                        href={publication.downloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-[9/14] w-full overflow-hidden rounded-lg block"
                      >
                        <Image
                          src={publication.thumbnail}
                          alt={language === 'en' && publication.titleEn ? publication.titleEn : publication.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-black">
                        {language === 'en' && publication.titleEn ? publication.titleEn : publication.title}
                      </h3>

                      {/* Description */}
                      <div className="text-gray-600 text-sm leading-relaxed flex-1 publication-description">
                        <RichContent
                          content={language === 'en' && publication.descriptionEn ? publication.descriptionEn : publication.description}
                        />
                      </div>
                      
                      {/* Download Link */}
                      <div className="pt-2 mt-auto">
                        <Link
                          href={publication.downloadLink}
                          className="inline-flex items-center text-black hover:text-gray-700 font-medium text-sm transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>{language === 'en' ? 'Download PDF' : 'Descargar PDF'}</span>
                          <svg 
                            className="ml-2 w-4 h-4" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">{language === 'en' ? 'No publications available.' : 'No hay publicaciones disponibles.'}</p>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
  );
}
