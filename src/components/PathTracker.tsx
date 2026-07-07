'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global path tracker component.
 * Saves the previous and current path to sessionStorage on every route change.
 * Used by listing pages to determine if filters should be restored or reset.
 */
export default function PathTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Move current path to prev, save new current
    const currentPath = sessionStorage.getItem('current-path') || '';
    if (currentPath !== pathname) {
      sessionStorage.setItem('prev-path', currentPath);
      sessionStorage.setItem('current-path', pathname);
    }
  }, [pathname]);

  return null;
}
