import { ContactContent } from '@/types';

const CONTACT_STORAGE_KEY = 'contact_content';

export class ContactStorage {
  static get(): ContactContent | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(CONTACT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading contact content from localStorage:', error);
      return null;
    }
  }

  static save(content: ContactContent): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(content));
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('contactContentUpdated', { detail: content }));
    } catch (error) {
      console.error('Error saving contact content to localStorage:', error);
    }
  }

  static clear(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(CONTACT_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('contactContentUpdated', { detail: null }));
    } catch (error) {
      console.error('Error clearing contact content from localStorage:', error);
    }
  }
}
