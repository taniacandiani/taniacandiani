import { Publication } from '@/types';

const STORAGE_KEY = 'tania_publications';

export class PublicationStorage {
  static getAll(): Publication[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static getById(id: string): Publication | null {
    const publications = this.getAll();
    return publications.find(p => p.id === id) || null;
  }

  static save(publication: Publication): void {
    const publications = this.getAll();
    const existingIndex = publications.findIndex(p => p.id === publication.id);
    
    if (existingIndex !== -1) {
      publications[existingIndex] = publication;
    } else {
      publications.push(publication);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(publications));
    window.dispatchEvent(new CustomEvent('publicationsUpdated'));
  }

  static remove(id: string): void {
    const publications = this.getAll();
    const filtered = publications.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('publicationsUpdated'));
  }

  static saveAll(publications: Publication[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(publications));
    window.dispatchEvent(new CustomEvent('publicationsUpdated'));
  }

  static getPublished(): Publication[] {
    return this.getAll().filter(p => p.status === 'published');
  }

  static getFeatured(): Publication[] {
    return this.getPublished().filter(p => p.featured);
  }
}
