import { Exhibition } from '@/types';

export class ExhibitionStorage {
  // Get all exhibitions
  static async getAll(): Promise<Exhibition[]> {
    try {
      const response = await fetch('/api/exhibitions');
      if (!response.ok) {
        throw new Error('Failed to fetch exhibitions');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
      return [];
    }
  }

  // Get exhibition by ID
  static async getById(id: string): Promise<Exhibition | null> {
    try {
      const response = await fetch(`/api/exhibitions/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exhibition');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching exhibition:', error);
      return null;
    }
  }

  // Get exhibition by slug
  static async getBySlug(slug: string): Promise<Exhibition | null> {
    try {
      const response = await fetch(`/api/exhibitions/slug/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exhibition by slug');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching exhibition by slug:', error);
      return null;
    }
  }

  // Get active exhibitions (with "Activas" category)
  static async getActive(): Promise<Exhibition[]> {
    try {
      const response = await fetch('/api/exhibitions?category=Activas');
      if (!response.ok) {
        throw new Error('Failed to fetch active exhibitions');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching active exhibitions:', error);
      return [];
    }
  }

  // Get exhibitions for home page (active exhibitions, limited)
  static async getForHome(limit: number = 6): Promise<Exhibition[]> {
    try {
      const response = await fetch(`/api/exhibitions?category=Activas&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exhibitions for home');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching exhibitions for home:', error);
      return [];
    }
  }

  // Create exhibition
  static async create(exhibition: Omit<Exhibition, 'id'>): Promise<Exhibition | null> {
    try {
      const response = await fetch('/api/exhibitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exhibition),
      });

      if (!response.ok) {
        throw new Error('Failed to create exhibition');
      }

      const savedExhibition = await response.json();

      // Dispatch event for updates
      window.dispatchEvent(new CustomEvent('exhibitionsUpdated'));

      return savedExhibition;
    } catch (error) {
      console.error('Error creating exhibition:', error);
      return null;
    }
  }

  // Update exhibition
  static async update(id: string, exhibition: Partial<Exhibition>): Promise<Exhibition | null> {
    try {
      const response = await fetch(`/api/exhibitions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exhibition),
      });

      if (!response.ok) {
        throw new Error('Failed to update exhibition');
      }

      const updatedExhibition = await response.json();

      // Dispatch event for updates
      window.dispatchEvent(new CustomEvent('exhibitionsUpdated'));

      return updatedExhibition;
    } catch (error) {
      console.error('Error updating exhibition:', error);
      return null;
    }
  }

  // Delete exhibition
  static async delete(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/exhibitions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete exhibition');
      }

      // Dispatch event for updates
      window.dispatchEvent(new CustomEvent('exhibitionsUpdated'));

      return true;
    } catch (error) {
      console.error('Error deleting exhibition:', error);
      return false;
    }
  }

  // Migrate exhibitions to multiple categories (if needed for existing data)
  static async migrateToMultipleCategories(): Promise<void> {
    try {
      const exhibitions = await this.getAll();

      for (const exhibition of exhibitions) {
        // If categories is not an array, convert it
        if (exhibition.categories && !Array.isArray(exhibition.categories)) {
          const updatedExhibition = {
            ...exhibition,
            categories: [exhibition.categories as any]
          };

          await this.update(exhibition.id, updatedExhibition);
        }
      }

      console.log('Migration to multiple categories completed');
    } catch (error) {
      console.error('Error during migration:', error);
    }
  }
}