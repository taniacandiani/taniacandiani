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
}

export interface NavigationItem {
  href: string;
  label: string;
}

export interface ProjectInfo {
  commissionedBy: string;
  curator: string;
  year: string;
  category: string;
}

export interface Project {
  id: string;
  title: string;
  image: string;
  category: string;
  year: number;
  description?: string;
  slug?: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  count: number;
} 