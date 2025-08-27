import { ContactContent } from '@/types';

export class ContactStorage {
  static async get(): Promise<ContactContent | null> {
    try {
      const response = await fetch('/api/contact');
      if (!response.ok) {
        throw new Error('Failed to fetch contact content');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching contact content:', error);
      return null;
    }
  }

  static async save(content: ContactContent): Promise<void> {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Failed to save contact content: ${errorMessage}`);
      }
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('contactContentUpdated', { detail: content }));
      }
    } catch (error) {
      console.error('Error saving contact content:', error);
      throw error;
    }
  }

  static async update(content: ContactContent): Promise<void> {
    try {
      const response = await fetch('/api/contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Failed to update contact content: ${errorMessage}`);
      }
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('contactContentUpdated', { detail: content }));
      }
    } catch (error) {
      console.error('Error updating contact content:', error);
      throw error;
    }
  }

  static async clear(): Promise<void> {
    try {
      // Para clear, podríamos implementar un endpoint específico
      // Por ahora, usamos el método existente
      console.log('Clear method not implemented yet');
    } catch (error) {
      console.error('Error clearing contact content:', error);
      throw error;
    }
  }
}
