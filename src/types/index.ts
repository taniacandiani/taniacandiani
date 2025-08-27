// Core entities
export interface Slide {
  image: string;
  title: string;
  text: string;
}

export interface NewsItem {
  id: string;
  image: string;
  title: string;
  description: string;
  link: string;
  publishedAt?: string;
  category?: string;
}

export interface Project {
  id: string;
  title: string;
  image: string;
  category: string;
  year: number;
  description: string;
  slug: string;
  tags?: string[];
  featured?: boolean;
  status?: 'published' | 'draft' | 'archived';
}

export interface ProjectCategory {
  id: string;
  name: string;
  count: number;
  description?: string;
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