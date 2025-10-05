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
  slug: string;
  publishedAt: string;
  categories?: string[]; // Changed from single category to array
  author?: string;
  status?: 'published' | 'draft' | 'archived';
  tags?: string[];
}

export interface Project {
  id: string;
  title: string;
  subtitle?: string;
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
  projectDetails?: string; // Full project description (HTML)
  technicalSheet?: string; // Technical sheet content (HTML)
  downloadLink?: string; // PDF download link
  additionalImage?: string; // Bottom image

  // Hero display options
  showInHomeHero?: boolean; // Checkbox to show in home hero
  heroDescription?: string; // Custom description for home hero

  // Additional project metadata
  commissionedBy?: string;
  curator?: string;
  location?: string;
  duration?: string;
  projectInfo?: ProjectMetadata[];

  // English translations
  title_en?: string;
  subtitle_en?: string;
  description_en?: string;
  projectDetails_en?: string;
  technicalSheet_en?: string;
  heroDescription_en?: string;
  commissionedBy_en?: string;
  curator_en?: string;
  location_en?: string;
}

export interface ProjectMetadata {
  label: string;
  value: string;
  sublabel?: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  count: number;
  description?: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  count: number;
  description?: string;
}

export interface Publication {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  downloadLink: string;
  publishedAt: string;
  status?: 'published' | 'draft';
  featured?: boolean;
}

export interface AboutContent {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export interface ContactContent {
  id: string;
  title: string;
  description: string;
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