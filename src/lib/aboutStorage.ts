import { AboutContent } from '@/types';

const STORAGE_KEY = 'tania_about_content';

export class AboutStorage {
  static get(): AboutContent | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  static save(content: AboutContent): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    window.dispatchEvent(new CustomEvent('aboutUpdated'));
  }

  static delete(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('aboutUpdated'));
  }
}
