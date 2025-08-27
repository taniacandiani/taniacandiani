import { Project } from '@/types';

const STORAGE_KEY = 'tania_candiani_projects';

export class ProjectStorage {
  static getAll(): Project[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing stored projects:', error);
      return [];
    }
  }

  static getById(id: string): Project | null {
    const projects = this.getAll();
    return projects.find(p => p.id === id) || null;
  }

  static getBySlug(slug: string): Project | null {
    const projects = this.getAll();
    return projects.find(p => p.slug === slug) || null;
  }

  static save(project: Project): void {
    if (typeof window === 'undefined') return;
    
    const projects = this.getAll();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('projectsUpdated', { detail: projects }));
  }

  static delete(id: string): void {
    if (typeof window === 'undefined') return;
    
    const projects = this.getAll().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  static saveAll(projects: Project[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('projectsUpdated', { detail: projects }));
  }

  static getFeatured(): Project[] {
    return this.getAll().filter(p => p.showInHomeHero && p.status === 'published');
  }

  static getPublished(): Project[] {
    return this.getAll().filter(p => p.status === 'published');
  }

  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Migración: convertir categoría única a múltiples categorías
  static migrateToMultipleCategories(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const projects = this.getAll();
      let hasChanges = false;
      
      const migratedProjects = projects.map(project => {
        try {
          // Si el proyecto ya tiene categories, no hacer nada
          if (project.categories && Array.isArray(project.categories)) {
            return project;
          }
          
          // Si tiene category (string), convertir a categories (array)
          if ('category' in project && typeof (project as any).category === 'string') {
            hasChanges = true;
            const { category, ...rest } = project as any;
            return {
              ...rest,
              categories: category ? [category] : []
            };
          }
          
          // Si no tiene ni category ni categories, asignar array vacío
          if (!project.categories) {
            hasChanges = true;
            return {
              ...project,
              categories: []
            };
          }
          
          return project;
        } catch (error) {
          console.error('Error procesando proyecto durante migración:', error);
          return project;
        }
      });
      
      if (hasChanges) {
        this.saveAll(migratedProjects);
        console.log('Migración de categorías completada');
      }
    } catch (error) {
      console.error('Error durante migración de categorías:', error);
    }
  }
}
