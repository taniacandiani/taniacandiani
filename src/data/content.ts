import { Slide, NewsItem, ProjectInfo, Project, ProjectCategory } from '@/types';

export const HERO_SLIDES: Slide[] = [
  {
    image: '/fondo1.jpg',
    title: 'Desminar',
    text: 'Las placas de metal que conforman Fragmentos, Espacio de Arte y Memoria, creado en 2017 por la artista Doris Salcedo en la ciudad de Bogotá, son para Candiani una alegoría del campo tras la batalla, su pavimento de violencia reconfigurada guarda los restos de la guerra',
  },
  {
    image: '/fondo2.jpg',
    title: 'Desminar',
    text: 'Las placas de metal que conforman Fragmentos, Espacio de Arte y Memoria, creado en 2017 por la artista Doris Salcedo en la ciudad de Bogotá, son para Candiani una alegoría del campo tras la batalla, su pavimento de violencia reconfigurada guarda los restos de la guerra',
  },
  {
    image: '/fondo3.jpg',
    title: 'Desminar',
    text: 'Las placas de metal que conforman Fragmentos, Espacio de Arte y Memoria, creado en 2017 por la artista Doris Salcedo en la ciudad de Bogotá, son para Candiani una alegoría del campo tras la batalla, su pavimento de violencia reconfigurada guarda los restos de la guerra',
  },
];

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: '1',
    image: '/fondo1.jpg',
    title: 'Lorem Ipsum',
    description: 'Las placas de metal que conforman Fragmentos, Espacio de Arte y Memoria, creado en 2017 por la artista Doris Salcedo en la ciudad de Bogotá',
    link: '#',
  },
  {
    id: '2',
    image: '/fondo2.jpg',
    title: 'Lorem Ipsum',
    description: 'Las placas de metal que conforman Fragmentos, Espacio de Arte y Memoria, creado en 2017 por la artista Doris Salcedo en la ciudad de Bogotá',
    link: '#',
  },
  {
    id: '3',
    image: '/fondo3.jpg',
    title: 'Lorem Ipsum',
    description: 'Las placas de metal que conforman Fragmentos, Espacio de Arte y Memoria, creado en 2017 por la artista Doris Salcedo en la ciudad de Bogotá',
    link: '#',
  },
];

export const PROJECT_INFO: ProjectInfo = {
  commissionedBy: 'Fragmentos, Espacio de Arte y Memoria, Bogotá',
  curator: 'Gabriela Rangel',
  year: '2024',
  category: 'Sitio Específico',
};

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  { id: 'arqueologia-medios', name: 'Arqueología de los Medios', count: 12 },
  { id: 'sitio-especifico', name: 'Sitio Específico', count: 8 },
  { id: 'practicas-sociales', name: 'Prácticas Sociales', count: 15 },
  { id: 'lorem-ipsum', name: 'Lorem Ipsum', count: 6 },
  { id: 'lorem-lorem', name: 'Lorem Lorem', count: 9 },
];

export const PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Desminar - Fragmentos de Memoria',
    image: '/fondo1.jpg',
    category: 'Arqueología de los Medios',
    year: 2024,
    description: 'Proyecto contemporáneo que explora la intersección entre tecnología y memoria a través de las placas de metal que conforman Fragmentos, Espacio de Arte y Memoria.',
    slug: 'desminar-fragmentos-memoria',
    tags: ['memoria', 'violencia', 'reconstrucción'],
    featured: true,
    status: 'published'
  },
  {
    id: '2',
    title: 'Intervención Urbana',
    image: '/fondo2.jpg',
    category: 'Sitio Específico',
    year: 2024,
    description: 'Intervención artística en espacio público que dialoga con la arquitectura y la memoria colectiva urbana.',
    slug: 'intervencion-urbana',
    tags: ['espacio público', 'arquitectura'],
    featured: false,
    status: 'published'
  },
  {
    id: '3',
    title: 'Diálogos Comunitarios',
    image: '/fondo3.jpg',
    category: 'Prácticas Sociales',
    year: 2023,
    description: 'Práctica colaborativa con comunidades locales enfocada en la preservación de tradiciones orales.',
    slug: 'dialogos-comunitarios',
    tags: ['comunidad', 'tradición oral', 'colaboración'],
    featured: true,
    status: 'published'
  },
  {
    id: '4',
    title: 'Arqueología Digital',
    image: '/fondo1.jpg',
    category: 'Arqueología de los Medios',
    year: 2023,
    description: 'Exploración de medios abandonados y su reactivación a través de nuevas tecnologías.',
    slug: 'arqueologia-digital',
    tags: ['tecnología', 'obsolescencia', 'reactivación'],
    featured: false,
    status: 'published'
  },
  {
    id: '5',
    title: 'Monumento Temporal',
    image: '/fondo2.jpg',
    category: 'Sitio Específico',
    year: 2022,
    description: 'Instalación permanente en espacio urbano que cuestiona los conceptos de permanencia y memoria.',
    slug: 'monumento-temporal',
    tags: ['monumento', 'permanencia', 'memoria'],
    featured: false,
    status: 'published'
  },
  {
    id: '6',
    title: 'Talleres de Memoria',
    image: '/fondo3.jpg',
    category: 'Prácticas Sociales',
    year: 2022,
    description: 'Taller comunitario y creación colectiva enfocado en la recuperación de memorias locales.',
    slug: 'talleres-memoria',
    tags: ['taller', 'memoria local', 'creación colectiva'],
    featured: false,
    status: 'published'
  },
  {
    id: '7',
    title: 'Laboratorio Experimental',
    image: '/fondo1.jpg',
    category: 'Arqueología de los Medios',
    year: 2021,
    description: 'Proyecto experimental con nuevas tecnologías para la preservación y activación de archivos sonoros.',
    slug: 'laboratorio-experimental',
    tags: ['experimental', 'archivo sonoro', 'tecnología'],
    featured: false,
    status: 'published'
  },
  {
    id: '8',
    title: 'Intervenciones Conceptuales',
    image: '/fondo2.jpg',
    category: 'Sitio Específico',
    year: 2021,
    description: 'Serie de intervenciones conceptuales que exploran la relación entre espacio y tiempo.',
    slug: 'intervenciones-conceptuales',
    tags: ['conceptual', 'espacio-tiempo'],
    featured: false,
    status: 'published'
  },
  {
    id: '9',
    title: 'Obsolescencia Programada',
    image: '/fondo3.jpg',
    category: 'Arqueología de los Medios',
    year: 2020,
    description: 'Investigación sobre obsolescencia tecnológica y su impacto en la preservación cultural.',
    slug: 'obsolescencia-programada',
    tags: ['obsolescencia', 'preservación cultural'],
    featured: false,
    status: 'published'
  },
  {
    id: '10',
    title: 'Arquitectura Efímera',
    image: '/fondo1.jpg',
    category: 'Sitio Específico',
    year: 2020,
    description: 'Intervención arquitectónica temporal que cuestiona la permanencia de las estructuras urbanas.',
    slug: 'arquitectura-efimera',
    tags: ['arquitectura', 'efímero', 'urbano'],
    featured: false,
    status: 'published'
  },
  {
    id: '11',
    title: 'Colaboración Artística',
    image: '/fondo2.jpg',
    category: 'Prácticas Sociales',
    year: 2019,
    description: 'Colaboración con artistas locales para la creación de una obra colectiva sobre identidad.',
    slug: 'colaboracion-artistica',
    tags: ['colaboración', 'identidad', 'artistas locales'],
    featured: false,
    status: 'published'
  },
  {
    id: '12',
    title: 'Proyecto Rural',
    image: '/fondo3.jpg',
    category: 'Prácticas Sociales',
    year: 2018,
    description: 'Proyecto de larga duración en comunidad rural enfocado en la sostenibilidad y tradición.',
    slug: 'proyecto-rural',
    tags: ['rural', 'sostenibilidad', 'tradición', 'larga duración'],
    featured: false,
    status: 'published'
  }
]; 