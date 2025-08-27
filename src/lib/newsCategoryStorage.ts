import { NewsStorage } from './newsStorage';
import { NewsCategory } from '@/types';

const STORAGE_KEY = 'tania_news_categories';

export class NewsCategoryStorage {
  static getAll(): NewsCategory[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static getById(id: string): NewsCategory | null {
    const categories = this.getAll();
    return categories.find(c => c.id === id) || null;
  }

  static save(category: NewsCategory): void {
    if (typeof window === 'undefined') return;
    
    const categories = this.getAll();
    const existingIndex = categories.findIndex(c => c.id === category.id);
    
    if (existingIndex >= 0) {
      categories[existingIndex] = category;
    } else {
      categories.push(category);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('newsCategoriesUpdated'));
  }

  static delete(id: string): { success: boolean; message: string } {
    if (typeof window === 'undefined') {
      return { success: false, message: 'No se puede acceder al almacenamiento' };
    }
    
    const category = this.getById(id);
    if (!category) {
      return { success: false, message: 'Categoría no encontrada' };
    }
    
    // Check if category is being used by any news
    const news = NewsStorage.getAll();
    const newsUsingCategory = news.filter(n => n.category === category.name);
    
    if (newsUsingCategory.length > 0) {
      return { 
        success: false, 
        message: `No se puede eliminar la categoría "${category.name}" porque está siendo usada por ${newsUsingCategory.length} noticia(s)` 
      };
    }
    
    const categories = this.getAll().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('newsCategoriesUpdated'));
    
    return { success: true, message: 'Categoría eliminada correctamente' };
  }

  static saveAll(categories: NewsCategory[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('newsCategoriesUpdated'));
  }

  static updateCounts(): NewsCategory[] {
    const categories = this.getAll();
    const news = NewsStorage.getPublished();
    
    const updatedCategories = categories.map(cat => ({
      ...cat,
      count: news.filter(n => n.category === cat.name).length
    }));
    
    this.saveAll(updatedCategories);
    return updatedCategories;
  }
}
