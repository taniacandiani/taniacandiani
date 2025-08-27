import { Publication } from '@/types';

export class PublicationStorage {
  static async getAll(): Promise<Publication[]> {
    try {
      const response = await fetch('/api/publications');
      if (!response.ok) {
        throw new Error('Failed to fetch publications');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching publications:', error);
      return [];
    }
  }

  static async getById(id: string): Promise<Publication | null> {
    try {
      const publications = await this.getAll();
      return publications.find(p => p.id === id) || null;
    } catch (error) {
      console.error('Error getting publication by ID:', error);
      return null;
    }
  }

  static async save(publication: Publication): Promise<void> {
    try {
      const response = await fetch('/api/publications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publication),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Failed to save publication: ${errorMessage}`);
      }
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('publicationsUpdated'));
      }
    } catch (error) {
      console.error('Error saving publication:', error);
      throw error;
    }
  }

  static async update(publication: Publication): Promise<void> {
    try {
      const response = await fetch('/api/publications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publication),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Failed to update publication: ${errorMessage}`);
      }
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('publicationsUpdated'));
      }
    } catch (error) {
      console.error('Error updating publication:', error);
      throw error;
    }
  }

  static async remove(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/publications?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete publication');
      }
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('publicationsUpdated'));
      }
    } catch (error) {
      console.error('Error removing publication:', error);
      throw error;
    }
  }

  static async saveAll(publications: Publication[]): Promise<void> {
    try {
      // Para saveAll, podríamos implementar un endpoint específico
      // Por ahora, usamos el método existente
      for (const publication of publications) {
        await this.save(publication);
      }
    } catch (error) {
      console.error('Error saving all publications:', error);
      throw error;
    }
  }

  static async getPublished(): Promise<Publication[]> {
    try {
      const publications = await this.getAll();
      return publications.filter(p => p.status === 'published');
    } catch (error) {
      console.error('Error getting published publications:', error);
      return [];
    }
  }

  // Helper method to generate unique IDs
  static generateId(): string {
    return `pub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
