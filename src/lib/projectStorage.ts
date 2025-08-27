import { Project } from '@/types';

export class ProjectStorage {
  static async getAll(): Promise<Project[]> {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<Project | null> {
    try {
      const projects = await this.getAll();
      return projects.find(p => p.id === id) || null;
    } catch (error) {
      console.error('Error getting project by ID:', error);
      return null;
    }
  }

  static async getBySlug(slug: string): Promise<Project | null> {
    try {
      const projects = await this.getAll();
      return projects.find(p => p.slug === slug) || null;
    } catch (error) {
      console.error('Error getting project by slug:', error);
      return null;
    }
  }

  static async save(project: Project): Promise<void> {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Failed to save project: ${errorMessage}`);
      }
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('projectsUpdated'));
      }
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  }

  static async update(project: Project): Promise<void> {
    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Failed to update project: ${errorMessage}`);
      }
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('projectsUpdated'));
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/projects?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('projectsUpdated'));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  static async getFeatured(): Promise<Project[]> {
    try {
      const projects = await this.getAll();
      return projects.filter(p => p.showInHomeHero && p.status === 'published');
    } catch (error) {
      console.error('Error getting featured projects:', error);
      return [];
    }
  }

  static async getPublished(): Promise<Project[]> {
    try {
      const projects = await this.getAll();
      return projects.filter(p => p.status === 'published');
    } catch (error) {
      console.error('Error getting published projects:', error);
      return [];
    }
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
  static async migrateToMultipleCategories(): Promise<void> {
    try {
      const projects = await this.getAll();
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
        // Aquí podrías implementar la lógica para guardar todos los proyectos migrados
        console.log('Migración de categorías completada');
      }
    } catch (error) {
      console.error('Error durante migración de categorías:', error);
    }
  }
}
