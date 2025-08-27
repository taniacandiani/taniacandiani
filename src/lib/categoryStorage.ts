import { ProjectCategory } from '@/types';
import { ProjectStorage } from './projectStorage';

const STORAGE_KEY = 'tania_candiani_categories';

export class CategoryStorage {
  static getAll(): ProjectCategory[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing stored categories:', error);
      return [];
    }
  }

  static getById(id: string): ProjectCategory | null {
    const categories = this.getAll();
    return categories.find(c => c.id === id) || null;
  }

  static save(category: ProjectCategory): void {
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
    window.dispatchEvent(new CustomEvent('categoriesUpdated'));
  }

  static delete(id: string): { success: boolean; message: string } {
    if (typeof window === 'undefined') {
      return { success: false, message: 'No se puede acceder al almacenamiento' };
    }
    
    const category = this.getById(id);
    if (!category) {
      return { success: false, message: 'Categoría no encontrada' };
    }

    // Check if any projects use this category
    const projects = ProjectStorage.getAll();
    const projectsUsingCategory = projects.filter(p => p.category === category.name);
    
    if (projectsUsingCategory.length > 0) {
      return { 
        success: false, 
        message: `No se puede eliminar la categoría "${category.name}" porque está siendo usada por ${projectsUsingCategory.length} proyecto(s)` 
      };
    }
    
    const categories = this.getAll().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('categoriesUpdated'));
    
    return { success: true, message: 'Categoría eliminada correctamente' };
  }

  static saveAll(categories: ProjectCategory[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }

  static updateCounts(): ProjectCategory[] {
    const categories = this.getAll();
    const projects = ProjectStorage.getAll();
    
    const updatedCategories = categories.map(cat => ({
      ...cat,
      count: projects.filter(p => p.category === cat.name && p.status === 'published').length
    }));
    
    this.saveAll(updatedCategories);
    return updatedCategories;
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
