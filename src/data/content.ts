import { Slide, NewsItem, ProjectInfo, Project, ProjectCategory, NewsCategory, Publication, AboutContent, ContactContent } from '@/types';

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

export const NEWS_CATEGORIES: NewsCategory[] = [
  { id: 'exposiciones', name: 'Exposiciones', count: 0 },
  { id: 'conferencias', name: 'Conferencias', count: 0 },
  { id: 'residencias', name: 'Residencias', count: 0 },
  { id: 'talleres', name: 'Talleres', count: 0 },
  { id: 'proyectos', name: 'Proyectos', count: 0 },
];

export const ABOUT_CONTENT: AboutContent = {
  id: 'about-main',
  title: 'Acerca de Tania Candiani',
  content: `
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
    
    <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    
    <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
  `,
  lastUpdated: new Date().toISOString()
};

export const SAMPLE_PUBLICATIONS: Publication[] = [
  {
    id: 'pub-1',
    title: 'Arqueología de los Medios Contemporáneos',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.',
    thumbnail: '/fondo1.jpg',
    downloadLink: '#',
    publishedAt: '2024-01-15T10:00:00Z',
    status: 'published',
    featured: true
  },
  {
    id: 'pub-2',
    title: 'Prácticas Sociales en el Arte Digital',
    description: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Duis aute irure dolor in reprehenderit.',
    thumbnail: '/fondo2.jpg',
    downloadLink: '#',
    publishedAt: '2023-11-20T14:30:00Z',
    status: 'published',
    featured: false
  },
  {
    id: 'pub-3',
    title: 'Sitio Específico y Memoria Colectiva',
    description: 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt.',
    thumbnail: '/fondo3.jpg',
    downloadLink: '#',
    publishedAt: '2023-09-10T09:15:00Z',
    status: 'published',
    featured: true
  },
  {
    id: 'pub-4',
    title: 'Intersecciones Tecnológicas',
    description: 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores.',
    thumbnail: '/fondo1.jpg',
    downloadLink: '#',
    publishedAt: '2023-06-05T16:45:00Z',
    status: 'published',
    featured: false
  }
];

export const CONTACT_CONTENT: ContactContent = {
  id: 'contact-1',
  title: 'Contacto',
  description: '¿Tienes alguna pregunta o quieres colaborar? No dudes en contactarnos. Estamos aquí para ayudarte.',
  lastUpdated: new Date().toISOString()
};

export const SAMPLE_NEWS: NewsItem[] = [
  {
    id: 'noticia-1',
    title: 'Nueva Exposición de Arte Digital Contemporáneo',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    image: '/fondo1.jpg',
    slug: 'nueva-exposicion-arte-digital',
    publishedAt: '2024-12-15T10:00:00Z',
    categories: ['Exposiciones'],
    author: 'Tania Candiani',
    status: 'published',
    tags: ['arte digital', 'exposición', 'contemporáneo']
  },
  {
    id: 'noticia-2',
    title: 'Conferencia Internacional de Medios Arqueológicos',
    content: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
    image: '/fondo2.jpg',
    slug: 'conferencia-medios-arqueologicos',
    publishedAt: '2024-12-10T14:30:00Z',
    categories: ['Conferencias'],
    author: 'Tania Candiani',
    status: 'published',
    tags: ['conferencia', 'medios', 'arqueología']
  },
  {
    id: 'noticia-3',
    title: 'Residencia Artística en México 2024',
    content: 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam.',
    image: '/fondo3.jpg',
    slug: 'residencia-artistica-mexico-2024',
    publishedAt: '2024-12-05T09:15:00Z',
    categories: ['Residencias'],
    author: 'Tania Candiani',
    status: 'published',
    tags: ['residencia', 'méxico', 'arte']
  },
  {
    id: 'noticia-4',
    title: 'Taller de Prácticas Sociales en el Arte',
    content: 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.',
    image: '/fondo1.jpg',
    slug: 'taller-practicas-sociales-arte',
    publishedAt: '2024-11-28T16:45:00Z',
    categories: ['Talleres'],
    author: 'Tania Candiani',
    status: 'published',
    tags: ['taller', 'prácticas sociales', 'arte']
  },
  {
    id: 'noticia-5',
    title: 'Nuevo Proyecto de Sitio Específico',
    content: 'Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis.',
    image: '/fondo2.jpg',
    slug: 'nuevo-proyecto-sitio-especifico',
    publishedAt: '2024-11-20T11:20:00Z',
    categories: ['Proyectos'],
    author: 'Tania Candiani',
    status: 'published',
    tags: ['proyecto', 'sitio específico', 'nuevo']
  }
];

export const PROJECTS: Project[] = [
  {
    id: 'lifeblood',
    title: 'Lifeblood',
    subtitle: 'Lifeblood - Echoing Landscape',
    image: '/fondo1.jpg',
    category: 'Arqueología de los Medios',
    year: 2023,
    description: 'Exploración de la relación entre el nacimiento de la ciudad de Houston y las vías fluviales que atraviesan su geografía.',
    slug: 'lifeblood',
    tags: ['Houston', 'vías fluviales', 'historia', 'video instalación'],
    featured: true,
    status: 'published',
    
    // Extended fields
    heroImages: ['/fondo1.jpg', '/fondo2.jpg', '/fondo3.jpg'],
    projectDetails: `
      <p><strong>Lifeblood</strong> es el nombre de la exposición individual, en el <strong>Blaffer Art Museum de la Universidad de Houston</strong>, curada por <strong>Steven Matijcio</strong>, en la que <strong>Tania Candiani</strong> exploró la relación entre el nacimiento de la ciudad de Houston y las vías fluviales que atraviesan su geografía. <strong>La exposición es un viaje que cruza el pasado y el presente, lo vivo y lo perdido</strong>, para canalizar las muchas voces que resuenan en el alma de Houston.</p>
      
      <p>El alma de la exposición es el video Echoing Landscape.</p>
      
      <p>Una instalación inmersiva de sonido y video con narración poética que cuenta la historia fragmentada de las vías fluviales en Houston a través de cuatro capítulos: un pasado precolonial, violencia y trabajo, desastres urbano y la actualidad. Los cuatro capítulos, que superponen infraestructuras ecológicas y tecnológicas del pasado y el presente, invocan los espectros de la historia para revelar lo que nos deparará el futuro.</p>
      
      <p>En el primer capítulo, destaca el verde como referencia a la naturaleza, evoca a los administradores originales de la tierra y el agua (los pueblos Karankawa, Atakapa y Akokisa) simbolizados por la figura solitaria en una canoa navegando en un plano reflectante de agua. El segundo capítulo, representado por el rojo, evoca la historia de la producción de ladrillos en Houston y la extracción de tierra, mano de obra a través de una reescenificación de canciones de trabajo que se escuchaban comúnmente entre los esclavos negros.</p>
    `,
    technicalSheet: `
      <p><strong>Técnica:</strong> Video instalación inmersiva</p>
      <p><strong>Duración:</strong> 15 minutos (loop)</p>
      <p><strong>Dimensiones:</strong> Variable</p>
      <p><strong>Materiales:</strong> Video HD, sistema de sonido multicanal, proyección</p>
      <p><strong>Año de creación:</strong> 2023</p>
      <p><strong>Comisión:</strong> Blaffer Art Museum, Universidad de Houston</p>
    `,
    downloadLink: '#', // placeholder
    additionalImage: '/fondo2.jpg',
    showInHomeHero: true,
    heroDescription: 'Las placas de metal que conforman Fragmentos, Espacio de Arte y Memoria, creado en 2017 por la artista Doris Salcedo en la ciudad de Bogotá, son para Candiani una alegoría del campo tras la batalla, su pavimento de violencia reconfigurada guarda los restos de la guerra',
    commissionedBy: 'Blaffer Art Museum, Universidad de Houston',
    curator: 'Steven Matijcio',
    location: 'Houston, Texas',
    projectInfo: [
      {
        label: 'Buffalo Bayou, 1953',
        value: 'y Caddo Canoe',
      },
      {
        label: 'Buffalo Bayou, 1953',
        value: 'y Caddo Canoe',
      }
    ]
  },
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