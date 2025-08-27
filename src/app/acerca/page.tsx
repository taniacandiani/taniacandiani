'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MainLayout from '@/components/MainLayout';
import Section from '@/components/Section';
import { AboutContent, Publication } from '@/types';
import { AboutStorage } from '@/lib/aboutStorage';
import { PublicationStorage } from '@/lib/publicationStorage';
import { ABOUT_CONTENT, SAMPLE_PUBLICATIONS } from '@/data/content';

export default function AcercaPage() {
  const [aboutContent, setAboutContent] = useState<AboutContent>(ABOUT_CONTENT);
  const [publications, setPublications] = useState<Publication[]>([]);

  useEffect(() => {
    // Initialize about content
    const storedContent = AboutStorage.get();
    if (storedContent) {
      setAboutContent(storedContent);
    } else {
      AboutStorage.save(ABOUT_CONTENT);
    }

    // Initialize publications
    const storedPublications = PublicationStorage.getAll();
    if (storedPublications.length === 0) {
      PublicationStorage.saveAll(SAMPLE_PUBLICATIONS);
      setPublications(SAMPLE_PUBLICATIONS);
    } else {
      setPublications(PublicationStorage.getPublished());
    }
  }, []);

  // Listen for updates from admin
  useEffect(() => {
    const handleAboutUpdate = () => {
      const updatedContent = AboutStorage.get();
      if (updatedContent) {
        setAboutContent(updatedContent);
      }
    };

    const handlePublicationsUpdate = () => {
      const updatedPublications = PublicationStorage.getPublished();
      setPublications(updatedPublications);
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
      <Section className="py-20">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {aboutContent.title}
            </h1>
          </div>

          {/* About Content */}
          <div className="prose prose-lg max-w-none mb-20">
            <div 
              dangerouslySetInnerHTML={{ __html: aboutContent.content }}
              className="text-black leading-relaxed"
            />
          </div>

          {/* Publications Section */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-black mb-12">
              Publicaciones
            </h2>
            
            {publications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {publications.map((publication) => (
                  <div key={publication.id} className="group">
                    <div className="space-y-4">
                      {/* Thumbnail */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                        <Image
                          src={publication.thumbnail}
                          alt={publication.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-lg font-semibold text-black">
                        {publication.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {publication.description}
                      </p>
                      
                      {/* Download Link */}
                      <div className="pt-2">
                        <Link
                          href={publication.downloadLink}
                          className="inline-flex items-center text-black hover:text-gray-700 font-medium text-sm transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>Descargar PDF</span>
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
                <p className="text-gray-500">No hay publicaciones disponibles.</p>
              </div>
            )}
          </div>
        </div>
      </Section>
    </MainLayout>
  );
}
