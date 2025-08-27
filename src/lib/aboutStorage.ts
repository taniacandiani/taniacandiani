import { AboutContent } from '@/types';

export class AboutStorage {
  static async get(): Promise<AboutContent | null> {
    try {
      const response = await fetch('/api/about');
      if (!response.ok) {
        throw new Error('Failed to fetch about content');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching about content:', error);
      return null;
    }
  }

  static async save(content: AboutContent): Promise<void> {
    try {
      const response = await fetch('/api/about', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Failed to save about content: ${errorMessage}`);
      }
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('aboutUpdated'));
      }
    } catch (error) {
      console.error('Error saving about content:', error);
      throw error;
    }
  }

  static async update(content: AboutContent): Promise<void> {
    try {
      const response = await fetch('/api/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Failed to update about content: ${errorMessage}`);
      }
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('aboutUpdated'));
      }
    } catch (error) {
      console.error('Error updating about content:', error);
      throw error;
    }
  }

  static async delete(): Promise<void> {
    try {
      // Para delete, podríamos implementar un endpoint específico
      // Por ahora, usamos el método existente
      console.log('Delete method not implemented yet');
    } catch (error) {
      console.error('Error deleting about content:', error);
      throw error;
    }
  }
}
