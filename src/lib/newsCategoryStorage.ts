import { NewsStorage } from './newsStorage';
import { NewsCategory } from '@/types';

export class NewsCategoryStorage {
  static async getAll(): Promise<NewsCategory[]> {
    try {
      const response = await fetch('/api/news-categories');
      if (!response.ok) {
        throw new Error('Failed to fetch news categories');
      }
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching news categories:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<NewsCategory | null> {
    try {
      const categories = await this.getAll();
      return categories.find(c => c.id === id) || null;
    } catch (error) {
      console.error('Error getting category by ID:', error);
      return null;
    }
  }

  static async save(category: NewsCategory): Promise<void> {
    try {
      const response = await fetch('/api/news-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save category');
      }

      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('categoriesUpdated'));
      }
    } catch (error) {
      console.error('Error saving news category:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const category = await this.getById(id);
      if (!category) {
        return { success: false, message: 'Categoría no encontrada' };
      }
      
      // Check if category is being used by any news
      const news = await NewsStorage.getAll();
      const newsUsingCategory = news.filter(n => n.categories?.includes(category.name));
      
      if (newsUsingCategory.length > 0) {
        return { 
          success: false, 
          message: `No se puede eliminar la categoría "${category.name}" porque está siendo usada por ${newsUsingCategory.length} noticia(s)` 
        };
      }
      
      // Call the API to delete the category
      const response = await fetch(`/api/news-categories?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }
      
      // Dispatch custom event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('categoriesUpdated'));
      }
      
      return { success: true, message: 'Categoría eliminada correctamente' };
    } catch (error) {
      console.error('Error deleting news category:', error);
      return { success: false, message: 'Error al eliminar la categoría' };
    }
  }

  static async updateCounts(): Promise<NewsCategory[]> {
    try {
      const categories = await this.getAll();
      const news = await NewsStorage.getPublished();
      
      const updatedCategories = categories.map(cat => ({
        ...cat,
        count: news.filter(n => n.categories?.includes(cat.name)).length
      }));
      
      // For now, just log since we don't have a categories API yet
      console.log('NewsCategoryStorage.updateCounts() - API not implemented yet');
      console.log('Updated categories with counts:', updatedCategories);
      
      return updatedCategories;
    } catch (error) {
      console.error('Error updating news category counts:', error);
      return [];
    }
  }
}
