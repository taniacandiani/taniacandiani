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
    title: 'Lorem Ipsum',
    image: '/fondo1.jpg',
    category: 'Arqueología de los Medios',
    year: 2024,
    description: 'Proyecto contemporáneo que explora la intersección entre tecnología y memoria',
    slug: 'lorem-ipsum-1'
  },
  {
    id: '2',
    title: 'Lorem Ipsum',
    image: '/fondo2.jpg',
    category: 'Sitio Específico',
    year: 2024,
    description: 'Intervención artística en espacio público',
    slug: 'lorem-ipsum-2'
  },
  {
    id: '3',
    title: 'Lorem Ipsum',
    image: '/fondo3.jpg',
    category: 'Prácticas Sociales',
    year: 2023,
    description: 'Práctica colaborativa con comunidades locales',
    slug: 'lorem-ipsum-3'
  },
  {
    id: '4',
    title: 'Lorem Ipsum',
    image: '/fondo1.jpg',
    category: 'Arqueología de los Medios',
    year: 2023,
    description: 'Exploración de medios abandonados y su reactivación',
    slug: 'lorem-ipsum-4'
  },
  {
    id: '5',
    title: 'Lorem Ipsum',
    image: '/fondo2.jpg',
    category: 'Sitio Específico',
    year: 2022,
    description: 'Instalación permanente en espacio urbano',
    slug: 'lorem-ipsum-5'
  },
  {
    id: '6',
    title: 'Lorem Ipsum',
    image: '/fondo3.jpg',
    category: 'Prácticas Sociales',
    year: 2022,
    description: 'Taller comunitario y creación colectiva',
    slug: 'lorem-ipsum-6'
  },
  {
    id: '7',
    title: 'Lorem Ipsum',
    image: '/fondo1.jpg',
    category: 'Lorem Ipsum',
    year: 2021,
    description: 'Proyecto experimental con nuevas tecnologías',
    slug: 'lorem-ipsum-7'
  },
  {
    id: '8',
    title: 'Lorem Ipsum',
    image: '/fondo2.jpg',
    category: 'Lorem Lorem',
    year: 2021,
    description: 'Serie de intervenciones conceptuales',
    slug: 'lorem-ipsum-8'
  },
  {
    id: '9',
    title: 'Lorem Ipsum',
    image: '/fondo3.jpg',
    category: 'Arqueología de los Medios',
    year: 2020,
    description: 'Investigación sobre obsolescencia tecnológica',
    slug: 'lorem-ipsum-9'
  },
  {
    id: '10',
    title: 'Lorem Ipsum',
    image: '/fondo1.jpg',
    category: 'Sitio Específico',
    year: 2020,
    description: 'Intervención arquitectónica temporal',
    slug: 'lorem-ipsum-10'
  },
  {
    id: '11',
    title: 'Lorem Ipsum',
    image: '/fondo2.jpg',
    category: 'Prácticas Sociales',
    year: 2019,
    description: 'Colaboración con artistas locales',
    slug: 'lorem-ipsum-11'
  },
  {
    id: '12',
    title: 'Lorem Ipsum',
    image: '/fondo3.jpg',
    category: 'Lorem Lorem',
    year: 2018,
    description: 'Proyecto de larga duración en comunidad rural',
    slug: 'lorem-ipsum-12'
  }
]; 