import { ProjectCategory } from '@/types';
import { ProjectStorage } from './projectStorage';

export class CategoryStorage {
  static async getAll(): Promise<ProjectCategory[]> {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch project categories');
      }
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching project categories:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<ProjectCategory | null> {
    try {
      const categories = await this.getAll();
      return categories.find(c => c.id === id) || null;
    } catch (error) {
      console.error('Error getting category by ID:', error);
      return null;
    }
  }

  static async save(category: ProjectCategory): Promise<void> {
    try {
      const response = await fetch('/api/categories', {
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
      console.error('Error saving category:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const category = await this.getById(id);
      if (!category) {
        return { success: false, message: 'Categoría no encontrada' };
      }

      // Check if any projects use this category
      const projects = await ProjectStorage.getAll();
      const projectsUsingCategory = projects.filter(p => p.categories?.includes(category.name));
      
      if (projectsUsingCategory.length > 0) {
        return { 
          success: false, 
          message: `No se puede eliminar la categoría "${category.name}" porque está siendo usada por ${projectsUsingCategory.length} proyecto(s)` 
        };
      }
      
      // Call the API to delete the category
      const response = await fetch(`/api/categories?id=${id}`, {
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
      console.error('Error deleting category:', error);
      return { success: false, message: 'Error al eliminar la categoría' };
    }
  }

  static async saveAll(categories: ProjectCategory[]): Promise<void> {
    try {
      // For now, just log since we don't have a categories API yet
      console.log('CategoryStorage.saveAll() - API not implemented yet');
      console.log('Categories to save:', categories);
    } catch (error) {
      console.error('Error saving all categories:', error);
      throw error;
    }
  }

  static async updateCounts(): Promise<ProjectCategory[]> {
    try {
      const categories = await this.getAll();
      const projects = await ProjectStorage.getAll();
      
      const updatedCategories = categories.map(cat => ({
        ...cat,
        count: projects.filter(p => p.categories?.includes(cat.name) && p.status === 'published').length
      }));
      
      // For now, just log since we don't have a categories API yet
      console.log('CategoryStorage.updateCounts() - API not implemented yet');
      console.log('Updated categories with counts:', updatedCategories);
      
      return updatedCategories;
    } catch (error) {
      console.error('Error updating category counts:', error);
      return [];
    }
  }

  static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
}
