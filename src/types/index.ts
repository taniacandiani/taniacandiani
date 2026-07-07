// Core entities
export interface Slide {
  image: string;
  title: string;
  text: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string; // Full article content (required)
  image: string; // Main card image
  heroImages?: string[]; // Slider images for hero (like projects)
  heroImageContain?: boolean; // Display hero image with object-contain instead of object-cover
  slug: string;
  publishedAt: string;
  categories?: string[]; // Changed from single category to array
  author?: string;
  status?: 'published' | 'draft' | 'archived';
  tags?: string[];

  // English translations
  titleEn?: string;
  contentEn?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectTab {
  id: string;
  projectId: string;
  tabOrder: number;
  title: string;
  heroImages?: string[];
  heroImageDescriptions?: string[];
  heroImageDescriptions_en?: string[];
  imagesWithoutSlider?: boolean; // New: Display images without slider
  sliderImagesContain?: boolean; // New: Display slider images with object-contain
  additionalImage?: string;
  projectDetails?: string;
  credits?: string;
  technicalSheet?: string;

  // PDF Document (new fields)
  pdfUrl?: string;
  pdfTitle?: string;
  pdfTitle_en?: string;
  pdfButtonText?: string;
  pdfButtonText_en?: string;

  // Video Embed (supports multiple videos)
  videoUrls?: string[];

  title_en?: string;
  projectDetails_en?: string;
  credits_en?: string;
  technicalSheet_en?: string;
}

export interface Project {
  id: string;
  title: string;
  image: string; // Main card image
  categories: string[]; // Changed from single category to array
  year: number;
  description: string;
  slug: string;
  tags?: string[];
  featured?: boolean;
  status?: 'published' | 'draft' | 'archived';

  // Extended fields for full project page
  heroImages?: string[]; // Slider images for hero
  heroImageDescriptions?: string[]; // Descriptions for each hero image (for project slider)
  heroImageDescriptions_en?: string[]; // English descriptions for hero images
  projectDetails?: string; // Full project description (HTML)
  credits?: string; // Credits content (HTML)
  technicalSheet?: string; // Technical sheet content (HTML)
  downloadLink?: string; // PDF download link
  additionalImage?: string; // Bottom image

  // PDF Document
  pdfUrl?: string; // URL del PDF en Cloudinary
  pdfButtonText?: string; // Texto del botón PDF en español
  pdfButtonText_en?: string; // Texto del botón PDF en inglés

  // Video Embed (supports multiple videos)
  videoUrls?: string[]; // URLs de videos de YouTube o Vimeo

  // Hero display options
  showInHomeHero?: boolean; // Checkbox to show in home hero
  heroDescription?: string; // Custom description for home hero (HOME page only)
  imagesWithoutSlider?: boolean; // New: Display images without slider
  sliderImagesContain?: boolean; // New: Display slider images with object-contain

  // Additional project metadata
  commissionedBy?: string;
  curator?: string;
  location?: string;
  duration?: string;
  projectInfo?: ProjectMetadata[];
  tabs?: ProjectTab[]; // New: Dynamic tabs

  // English translations
  title_en?: string;
  description_en?: string;
  projectDetails_en?: string;
  credits_en?: string;
  technicalSheet_en?: string;
  heroDescription_en?: string;
  commissionedBy_en?: string;
  curator_en?: string;
  location_en?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectMetadata {
  label: string;
  value: string;
  sublabel?: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  nameEn?: string;
  count: number;
  description?: string;
  descriptionEn?: string;
}

export interface Exhibition {
  id: string;
  title: string;
  content: string; // Full exhibition content (required)
  image: string; // Main card image
  heroImages?: string[]; // Slider images for hero (like projects)
  heroImageContain?: boolean; // Display hero image with object-contain instead of object-cover
  slug: string;
  publishedAt: string;
  categories?: string[]; // Multiple categories
  venue?: string; // Exhibition venue
  startDate?: string; // Exhibition start date
  endDate?: string; // Exhibition end date
  curator?: string;
  status?: 'published' | 'draft' | 'archived';
  tags?: string[];
  externalLink?: string; // External exhibition URL

  // English translations
  titleEn?: string;
  contentEn?: string;
  venueEn?: string;
  curatorEn?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface ExhibitionCategory {
  id: string;
  name: string;
  nameEn?: string;
  count: number;
  description?: string;
  descriptionEn?: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  nameEn?: string;
  count: number;
  description?: string;
  descriptionEn?: string;
}

export interface Publication {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  thumbnail: string;
  downloadLink: string;
  publishedAt: string;
  status?: 'published' | 'draft';
  featured?: boolean;
  displayOrder?: number;
}

export interface AboutContent {
  id: string;
  title: string;
  content: string;
  title_en?: string;
  content_en?: string;

  // PDF Downloads
  cv_pdf?: string;
  cv_pdf_en?: string;
  cv_button_text?: string;
  cv_button_text_en?: string;

  bio_pdf?: string;
  bio_pdf_en?: string;
  bio_button_text?: string;
  bio_button_text_en?: string;

  portfolio_pdf?: string;
  portfolio_pdf_en?: string;
  portfolio_button_text?: string;
  portfolio_button_text_en?: string;

  // Additional Section
  additional_title?: string;
  additional_title_en?: string;
  additional_content?: string;
  additional_content_en?: string;

  lastUpdated: string;
}

export interface ContactContent {
  id: string;
  title: string;
  description: string;
  title_en?: string;
  description_en?: string;
  lastUpdated: string;
}

export interface ProjectInfo {
  commissionedBy: string;
  curator: string;
  year: string;
  category: string;
  location?: string;
  duration?: string;
}

// Navigation and UI types
export interface NavigationItem {
  href: string;
  label: string;
  label_en?: string;
  external?: boolean;
  children?: NavigationItem[];
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

// Component prop types
export interface HeroProps {
  slides: Slide[];
  autoPlay?: boolean;
  interval?: number;
}

export interface SectionProps {
  fullWidth?: boolean;
  indented?: boolean;
  className?: string;
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
}

export interface ProjectCardProps {
  project: Project;
  variant?: 'default' | 'featured' | 'minimal';
  onClick?: (project: Project) => void;
}

// Filter and sorting types
export type SortOption = 'date' | 'title' | 'category';
export type ViewMode = 'grid' | 'list';

export interface FilterState {
  searchTerm: string;
  selectedCategory: string | null;
  selectedYear: number | null;
  sortBy: SortOption;
}

// Utility types
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} 