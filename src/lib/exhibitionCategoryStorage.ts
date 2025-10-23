import { ExhibitionCategory } from '@/types';

export class ExhibitionCategoryStorage {
  // Get all categories
  static async getAll(): Promise<ExhibitionCategory[]> {
    try {
      const response = await fetch('/api/exhibitions/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch exhibition categories');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching exhibition categories:', error);
      return [];
    }
  }

  // Get category by ID
  static async getById(id: string): Promise<ExhibitionCategory | null> {
    try {
      const response = await fetch(`/api/exhibitions/categories/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exhibition category');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching exhibition category:', error);
      return null;
    }
  }

  // Create category
  static async create(category: Omit<ExhibitionCategory, 'id' | 'count'>): Promise<ExhibitionCategory | null> {
    try {
      const response = await fetch('/api/exhibitions/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error('Failed to create exhibition category');
      }

      const savedCategory = await response.json();

      // Dispatch event for updates
      window.dispatchEvent(new CustomEvent('exhibitionCategoriesUpdated'));

      return savedCategory;
    } catch (error) {
      console.error('Error creating exhibition category:', error);
      return null;
    }
  }

  // Update category
  static async update(id: string, category: Partial<ExhibitionCategory>): Promise<ExhibitionCategory | null> {
    try {
      const response = await fetch(`/api/exhibitions/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error('Failed to update exhibition category');
      }

      const updatedCategory = await response.json();

      // Dispatch event for updates
      window.dispatchEvent(new CustomEvent('exhibitionCategoriesUpdated'));

      return updatedCategory;
    } catch (error) {
      console.error('Error updating exhibition category:', error);
      return null;
    }
  }

  // Delete category
  static async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/exhibitions/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete exhibition category');
      }

      // Dispatch event for updates
      window.dispatchEvent(new CustomEvent('exhibitionCategoriesUpdated'));

      return true;
    } catch (error) {
      console.error('Error deleting exhibition category:', error);
      return false;
    }
  }

  // Update category counts
  static async updateCounts(): Promise<ExhibitionCategory[]> {
    try {
      const response = await fetch('/api/exhibitions/categories/update-counts', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to update category counts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating category counts:', error);
      return [];
    }
  }
}