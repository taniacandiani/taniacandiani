'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import MainLayout from '@/components/MainLayout';

export default function LifebloodPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('detalles');

  // Datos del proyecto
  const projectData = {
    title: 'Lifeblood',
    subtitle: 'Lifeblood - Echoing Landscape',
    year: 2023,
    categories: [
      'Arqueología de los Medios',
      'Sitio Específico',
      'Prácticas Sociales',
      'Prácticas sociales',
      'Lorem Ipsum',
      'Sitio Específico',
      'Prácticas Sociales',
      'Prácticas sociales'
    ],
    years: [2024, 2023, 2022, 2021, 2020, 2019, 2018]
  };

  // Imágenes del slider
  const sliderImages = [
    '/fondo1.jpg',
    '/fondo2.jpg',
    '/fondo3.jpg'
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-rotate del slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(interval);
  }, [sliderImages.length]);

  return (
    <MainLayout>
                   <div className="mx-8 py-8 pt-16">
        <div className="flex gap-8">
          {/* Sidebar Izquierdo */}
          <div className="w-64">
            {/* Título sticky */}
            <div className="sticky top-32 bg-white z-10 mb-8">
              <h1 className="text-2xl font-bold text-white bg-black px-4 py-2 text-center w-full" style={{ borderRadius: '5px' }}>{projectData.title}</h1>
            </div>

            {/* Resto del contenido */}
            <div>
              <div className="border-b border-gray-300 mb-4"></div>
              <p className="text-base text-gray-800 mb-8" style={{ fontWeight: 900 }}>{projectData.subtitle}</p>

              {/* Datos del proyecto */}
              <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
                <p className="text-base">
                  <span className="font-medium">Buffalo Bayou, 1953</span><br />
                  <span className="text-gray-600">y Caddo Canoe</span>
                </p>
                <p className="text-base mt-2">
                  <span className="font-medium">Buffalo Bayou, 1953</span><br />
                  <span className="text-gray-600">y Caddo Canoe</span>
                </p>
                <div className="mt-4">
                  <button className="flex items-center gap-2 text-base border border-gray-300 px-3 py-1 rounded">
                    <span>Descargar</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      picture_as_pdf
                    </span>
                  </button>
                </div>
              </div>

              {/* Categorías */}
              <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
                <h4 className="projects-h4 text-lg font-normal mb-4">Categorías</h4>
                <div className="space-y-2">
                  {projectData.categories.map((category, index) => (
                    <div key={index} className="text-base text-gray-600 py-1">
                      {category}
                    </div>
                  ))}
                </div>
              </div>

              {/* Años */}
              <div className="mb-8 pb-6 border-b border-[#E6E0E0]">
                <h4 className="projects-h4 text-lg font-normal mb-4">Año</h4>
                <div className="space-y-2">
                  {projectData.years.map((year) => (
                    <div key={year} className="text-base text-gray-600 py-1">
                      {year}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="flex-1">
            {/* Slider con puntitos */}
            <div className="relative mb-8">
              <div className="relative aspect-[16/7] overflow-hidden group" style={{ borderRadius: '5px' }}>
                <Image
                  src={sliderImages[currentSlide]}
                  alt={`Slide ${currentSlide + 1}`}
                  fill
                  className="object-cover"
                />
                
                {/* Flechas de navegación */}
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-75"
                  aria-label="Imagen anterior"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-75"
                  aria-label="Imagen siguiente"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Puntitos indicadores */}
              <div className="flex justify-center space-x-2 mt-4">
                {sliderImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full ${
                      index === currentSlide ? 'bg-black' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Título del proyecto */}
            <div className="mb-8">
              <h1 className="mb-4" style={{ fontWeight: 500, fontSize: '8rem' }}>{projectData.title}</h1>
              <div className="flex items-center gap-4 text-base text-gray-600">
                <span>Categoría: <span className="font-medium">Arqueología de los Medios, Sitio Específico, Categoría</span></span>
                <span>Año: <span className="font-medium">{projectData.year}</span></span>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8">
              <div className="grid grid-cols-3 border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('detalles')}
                  className={`px-6 pt-8 pb-6 text-lg font-medium border-r border-gray-200 ${
                    activeTab === 'detalles'
                      ? 'border-b-2 border-b-black text-black bg-gray-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Detalles del Proyecto
                </button>
                <button
                  onClick={() => setActiveTab('ficha')}
                  className={`px-6 pt-8 pb-6 text-lg font-medium border-r border-gray-200 ${
                    activeTab === 'ficha'
                      ? 'border-b-2 border-b-black text-black bg-gray-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Ficha Técnica
                </button>
                <a
                  href="#"
                  className="px-6 pt-8 pb-6 text-lg font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <span>Descargar</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    picture_as_pdf
                  </span>
                </a>
              </div>

              {/* Contenido de los tabs */}
              <div className="text-base text-gray-700 leading-relaxed pt-8 pb-8">
                {activeTab === 'detalles' && (
                  <div>
                    <p className="mb-4">
                      <strong>Lifeblood</strong> es el nombre de la exposición individual, en el <strong>Blaffer Art Museum de la Universidad de Houston</strong>, curada por <strong>Steven Matijcio</strong>, en la que <strong>Tania Candiani</strong> exploró la relación entre el nacimiento de la ciudad de Houston y las vías fluviales que atraviesan su geografía. <strong>La exposición es un viaje que cruza el pasado y el presente, lo vivo y lo perdido</strong>, para canalizar las muchas voces que resuenan en el alma de Houston.
                    </p>
                    <p className="mb-4">
                      El alma de la exposición es el video Echoing Landscape.
                    </p>
                    <p className="mb-4">
                      Una instalación inmersiva de sonido y video con narración poética que cuenta la historia fragmentada de las vías fluviales en Houston a través de cuatro capítulos: un pasado precolonial, violencia y trabajo, desastres urbano y la actualidad. Los cuatro capítulos, que superponen infraestructuras ecológicas y tecnológicas del pasado y el presente, invocan los espectros de la historia para revelar lo que nos deparará el futuro.
                    </p>
                    <p className="mb-4">
                      En el primer capítulo, destaca el verde como referencia a la naturaleza, evoca a los administradores originales de la tierra y el agua (los pueblos Karankawa, Atakapa y Akokisa) simbolizados por la figura solitaria en una canoa navegando en un plano reflectante de agua. El segundo capítulo, representado por el rojo, evoca la historia de la producción de ladrillos en Houston y la extracción de tierra, mano de obra a través de una reescenificación de canciones de trabajo que se escuchaban comúnmente entre los esclavos negros.
                    </p>
    
                  </div>
                )}
                {activeTab === 'ficha' && (
                  <div>
                    <p className="mb-4">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                    <p className="mb-4">
                      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                    <p className="mb-4">
                      Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Imagen adicional */}
            <div className="mb-32">
              <div className="relative aspect-[16/6] overflow-hidden" style={{ borderRadius: '5px' }}>
                <Image
                  src="/fondo2.jpg"
                  alt="Imagen adicional del proyecto"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

                      {/* Navegación inferior */}
          <div className="border-t border-gray-200">
            <div className="grid grid-cols-3 pt-8">
              <button className="px-6  text-lg font-medium text-gray-600 hover:text-black border-r border-gray-200 text-left">
                Proyecto Anterior
              </button>
              
              <button className="px-6  text-lg font-medium text-gray-600 hover:text-black border-r border-gray-200 flex items-center justify-center gap-2">
                <span>Descargar</span>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  picture_as_pdf
                </span>
              </button>
              
              <button className="px-6  text-lg font-medium text-gray-600 hover:text-black text-right">
                Siguiente Proyecto
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 