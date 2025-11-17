import { NewsItem } from '@/types';

export class NewsStorage {
  // Caché en memoria con tiempo de vida de 5 minutos
  private static cache: {
    all: { data: NewsItem[] | null; timestamp: number };
    allIncludingDrafts: { data: NewsItem[] | null; timestamp: number };
  } = {
    all: { data: null, timestamp: 0 },
    allIncludingDrafts: { data: null, timestamp: 0 }
  };
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Invalidar caché cuando se modifica data
  private static invalidateCache(): void {
    this.cache = {
      all: { data: null, timestamp: 0 },
      allIncludingDrafts: { data: null, timestamp: 0 }
    };
  }

  static async getAll(forceRefresh: boolean = false): Promise<NewsItem[]> {
    try {
      // Verificar si el caché es válido
      const now = Date.now();
      if (!forceRefresh &&
          this.cache.all.data &&
          (now - this.cache.all.timestamp) < this.CACHE_DURATION) {
        return this.cache.all.data;
      }

      const response = await fetch('/api/news');
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const news = await response.json();

      // Actualizar caché
      this.cache.all = { data: news, timestamp: now };

      return news;
    } catch (error) {
      console.error('Error fetching news:', error);
      // Si hay error y tenemos caché, devolver caché aunque esté expirado
      return this.cache.all.data || [];
    }
  }

  static async getAllIncludingDrafts(forceRefresh: boolean = false): Promise<NewsItem[]> {
    try {
      // Verificar si el caché es válido
      const now = Date.now();
      if (!forceRefresh &&
          this.cache.allIncludingDrafts.data &&
          (now - this.cache.allIncludingDrafts.timestamp) < this.CACHE_DURATION) {
        return this.cache.allIncludingDrafts.data;
      }

      const response = await fetch('/api/news?includeAll=true');
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const news = await response.json();

      // Actualizar caché
      this.cache.allIncludingDrafts = { data: news, timestamp: now };

      return news;
    } catch (error) {
      console.error('Error fetching news:', error);
      // Si hay error y tenemos caché, devolver caché aunque esté expirado
      return this.cache.allIncludingDrafts.data || [];
    }
  }

  static async getById(id: string): Promise<NewsItem | null> {
    try {
      const news = await this.getAllIncludingDrafts();
      return news.find(n => n.id === id) || null;
    } catch (error) {
      console.error('Error getting news by ID:', error);
      return null;
    }
  }

  static async getBySlug(slug: string): Promise<NewsItem | null> {
    try {
      const news = await this.getAll();
      return news.find(n => n.slug === slug) || null;
    } catch (error) {
      console.error('Error getting news by slug:', error);
      return null;
    }
  }

  static async save(newsItem: NewsItem): Promise<void> {
    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsItem),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Failed to save news: ${errorMessage}`);
      }

      // Invalidar caché después de guardar
      this.invalidateCache();

      // Dispatch custom event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('newsUpdated'));
      }
    } catch (error) {
      console.error('Error saving news:', error);
      throw error;
    }
  }

  static async update(newsItem: NewsItem): Promise<void> {
    try {
      const response = await fetch('/api/news', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsItem),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Failed to update news: ${errorMessage}`);
      }

      // Invalidar caché después de actualizar
      this.invalidateCache();

      // Dispatch custom event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('newsUpdated'));
      }
    } catch (error) {
      console.error('Error updating news:', error);
      throw error;
    }
  }

  static async remove(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/news?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete news');
      }

      // Invalidar caché después de eliminar
      this.invalidateCache();

      // Dispatch custom event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('newsUpdated'));
      }
    } catch (error) {
      console.error('Error deleting news:', error);
      throw error;
    }
  }

  static async getPublished(): Promise<NewsItem[]> {
    try {
      const news = await this.getAllIncludingDrafts();
      return news.filter(n => n.status === 'published');
    } catch (error) {
      console.error('Error getting published news:', error);
      return [];
    }
  }

  static async getForHome(): Promise<NewsItem[]> {
    try {
      const published = await this.getPublished();
      return published
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.publishedAt).getTime();
          const dateB = new Date(b.createdAt || b.publishedAt).getTime();
          return dateB - dateA;
        })
        .slice(0, 3);
    } catch (error) {
      console.error('Error getting home news:', error);
      return [];
    }
  }

  // Migración: convertir categoría única a múltiples categorías
  static async migrateToMultipleCategories(): Promise<void> {
    try {
      const news = await this.getAll();
      let hasChanges = false;
      
      const migratedNews = news.map(newsItem => {
        try {
          // Si la noticia ya tiene categories, no hacer nada
          if (newsItem.categories && Array.isArray(newsItem.categories)) {
            return newsItem;
          }
          
          // Si tiene category (string), convertir a categories (array)
          if ('category' in newsItem && typeof (newsItem as any).category === 'string') {
            hasChanges = true;
            const { category, ...rest } = newsItem as any;
            return {
              ...rest,
              categories: category ? [category] : []
            };
          }
          
          // Si no tiene ni category ni categories, asignar array vacío
          if (!newsItem.categories) {
            hasChanges = true;
            return {
              ...newsItem,
              categories: []
            };
          }
          
          return newsItem;
        } catch (error) {
          console.error('Error procesando noticia durante migración:', error);
          return newsItem;
        }
      });
      
      if (hasChanges) {
        // Aquí podrías implementar la lógica para guardar todas las noticias migradas
        console.log('Migración de categorías de noticias completada');
      }
    } catch (error) {
      console.error('Error durante migración de categorías de noticias:', error);
    }
  }
}
