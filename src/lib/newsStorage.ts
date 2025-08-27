import { NewsItem } from '@/types';

export class NewsStorage {
  static async getAll(): Promise<NewsItem[]> {
    try {
      const response = await fetch('/api/news');
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<NewsItem | null> {
    try {
      const news = await this.getAll();
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
      const news = await this.getAll();
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
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
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
