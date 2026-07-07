import { Project } from '@/types';

export class ProjectStorage {
  // Caché en memoria con tiempo de vida de 5 minutos
  private static cache: { data: Project[] | null; timestamp: number } = {
    data: null,
    timestamp: 0
  };
  private static summariesCache: { data: Project[] | null; timestamp: number } = {
    data: null,
    timestamp: 0
  };
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Promesas en vuelo para no disparar el mismo fetch varias veces en paralelo
  private static inFlightAll: Promise<Project[]> | null = null;
  private static inFlightSummaries: Promise<Project[]> | null = null;

  static async getAll(forceRefresh: boolean = false): Promise<Project[]> {
    try {
      // Verificar si el caché es válido
      const now = Date.now();
      if (!forceRefresh &&
          this.cache.data &&
          (now - this.cache.timestamp) < this.CACHE_DURATION) {
        return this.cache.data;
      }

      if (!forceRefresh && this.inFlightAll) {
        return await this.inFlightAll;
      }

      this.inFlightAll = (async () => {
        try {
          const response = await fetch('/api/projects');
          if (!response.ok) {
            throw new Error('Failed to fetch projects');
          }
          const projects = await response.json();
          this.cache = { data: projects, timestamp: Date.now() };
          return projects;
        } finally {
          this.inFlightAll = null;
        }
      })();

      return await this.inFlightAll;
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Si hay error y tenemos caché, devolver caché aunque esté expirado
      return this.cache.data || [];
    }
  }

  // Versión ligera para listados y sidebars: sin tabs ni HTML pesado,
  // con extracto precalculado (campo excerpt). Mucho más rápida de descargar.
  static async getSummaries(forceRefresh: boolean = false): Promise<Project[]> {
    try {
      const now = Date.now();
      if (!forceRefresh &&
          this.summariesCache.data &&
          (now - this.summariesCache.timestamp) < this.CACHE_DURATION) {
        return this.summariesCache.data;
      }

      if (!forceRefresh && this.inFlightSummaries) {
        return await this.inFlightSummaries;
      }

      this.inFlightSummaries = (async () => {
        try {
          const response = await fetch('/api/projects?summary=true');
          if (!response.ok) {
            throw new Error('Failed to fetch project summaries');
          }
          const projects = await response.json();
          this.summariesCache = { data: projects, timestamp: Date.now() };
          return projects;
        } finally {
          this.inFlightSummaries = null;
        }
      })();

      return await this.inFlightSummaries;
    } catch (error) {
      console.error('Error fetching project summaries:', error);
      return this.summariesCache.data || this.cache.data || [];
    }
  }

  // Invalidar caché cuando se modifica data
  private static invalidateCache(): void {
    this.cache = { data: null, timestamp: 0 };
    this.summariesCache = { data: null, timestamp: 0 };
    this.featuredCache = { data: null, timestamp: 0 };
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
      // Pedir solo el proyecto necesario: evita descargar la lista completa
      // (~1.3MB) para pintar la página de detalle
      const response = await fetch(`/api/projects?slug=${encodeURIComponent(slug)}`);
      if (response.ok) {
        return await response.json();
      }
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch project by slug');
    } catch (error) {
      console.error('Error getting project by slug:', error);
      // Fallback: buscar en el caché completo si existe
      return this.cache.data?.find(p => p.slug === slug) || null;
    }
  }

  static async save(project: Project): Promise<Project> {
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

      // Obtener el proyecto creado de la respuesta
      const createdProject = await response.json();

      // Invalidar caché después de guardar
      this.invalidateCache();

      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('projectsUpdated'));
      }

      return createdProject;
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

      // Invalidar caché después de actualizar
      this.invalidateCache();

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

      // Invalidar caché después de eliminar
      this.invalidateCache();

      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('projectsUpdated'));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  private static featuredCache: { data: Project[] | null; timestamp: number } = {
    data: null,
    timestamp: 0
  };
  private static inFlightFeatured: Promise<Project[]> | null = null;

  static async getFeatured(): Promise<Project[]> {
    try {
      const now = Date.now();
      if (this.featuredCache.data &&
          (now - this.featuredCache.timestamp) < this.CACHE_DURATION) {
        return this.featuredCache.data;
      }

      if (this.inFlightFeatured) {
        return await this.inFlightFeatured;
      }

      this.inFlightFeatured = (async () => {
        try {
          // Endpoint dedicado: devuelve solo los proyectos del carrusel de la
          // home (publicados y con showInHomeHero) sin descargar la lista completa
          const response = await fetch('/api/projects?hero=true');
          if (!response.ok) {
            throw new Error('Failed to fetch hero projects');
          }
          const projects: Project[] = await response.json();
          const featured = projects.filter(p => p.showInHomeHero && p.status === 'published');
          this.featuredCache = { data: featured, timestamp: Date.now() };
          return featured;
        } finally {
          this.inFlightFeatured = null;
        }
      })();

      return await this.inFlightFeatured;
    } catch (error) {
      console.error('Error getting featured projects:', error);
      // Fallback al caché completo si existe
      return this.featuredCache.data ||
        (this.cache.data || []).filter(p => p.showInHomeHero && p.status === 'published');
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
