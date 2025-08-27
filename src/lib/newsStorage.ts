import { NewsItem } from '@/types';

const STORAGE_KEY = 'tania_news';

export class NewsStorage {
  static getAll(): NewsItem[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static getById(id: string): NewsItem | null {
    const news = this.getAll();
    return news.find(n => n.id === id) || null;
  }

  static getBySlug(slug: string): NewsItem | null {
    const news = this.getAll();
    return news.find(n => n.slug === slug) || null;
  }

  static save(newsItem: NewsItem): void {
    if (typeof window === 'undefined') return;
    
    const news = this.getAll();
    const existingIndex = news.findIndex(n => n.id === newsItem.id);
    
    if (existingIndex >= 0) {
      news[existingIndex] = newsItem;
    } else {
      news.push(newsItem);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(news));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('newsUpdated'));
  }

  static remove(id: string): void {
    if (typeof window === 'undefined') return;
    
    const news = this.getAll().filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(news));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('newsUpdated'));
  }

  static saveAll(news: NewsItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(news));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('newsUpdated'));
  }

  static getPublished(): NewsItem[] {
    return this.getAll().filter(n => n.status === 'published');
  }

  static getForHome(): NewsItem[] {
    return this.getPublished()
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 3); // Maximum 3 for home - últimas 3 noticias publicadas
  }



  // Migración: convertir categoría única a múltiples categorías
  static migrateToMultipleCategories(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const news = this.getAll();
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
        this.saveAll(migratedNews);
        console.log('Migración de categorías de noticias completada');
        }
    } catch (error) {
      console.error('Error durante migración de categorías de noticias:', error);
    }
  }
}
