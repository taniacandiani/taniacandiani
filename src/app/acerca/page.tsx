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
import RichContent from '@/components/ui/RichContent';

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
      <div className="container-mobile py-8 pt-16">
          {/* Title */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-4xl font-medium tracking-widest text-black">
              {aboutContent.title}
            </h1>
          </div>

          {/* About Content */}
          <div className="prose prose-lg max-w-3xl mb-20">
            <RichContent 
              content={aboutContent.content}
              className="text-black leading-relaxed"
            />
          </div>

          {/* Publications Section */}
          <div className="mt-20">
            <h2 className="text-2xl md:text-4xl font-medium tracking-widest text-black mb-12">
              PUBLICACIONES
            </h2>
            
            {publications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      </MainLayout>
  );
}
