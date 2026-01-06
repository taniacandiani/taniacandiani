'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook para restaurar la posición del scroll cuando el usuario regresa a una página.
 *
 * @param key - Identificador único para la página (ej: 'proyectos', 'noticias')
 * @param isReady - Indica si el contenido está listo (loading === false)
 */
export function useScrollRestoration(key: string, isReady: boolean = true) {
  const hasRestored = useRef(false);
  const storageKey = `scroll-${key}`;

  // Guardar posición continuamente mientras el usuario hace scroll
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const pos = window.scrollY;
        if (pos > 0) {
          sessionStorage.setItem(storageKey, pos.toString());
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [storageKey]);

  // Restaurar posición cuando el contenido esté listo
  useEffect(() => {
    if (!isReady || hasRestored.current) return;

    const savedPosition = sessionStorage.getItem(storageKey);
    if (!savedPosition) return;

    const targetY = parseInt(savedPosition, 10);
    if (isNaN(targetY) || targetY <= 0) {
      sessionStorage.removeItem(storageKey);
      return;
    }

    hasRestored.current = true;

    // Función para intentar restaurar el scroll
    const tryRestore = (attempt: number = 0) => {
      const maxAttempts = 10;
      const documentHeight = document.documentElement.scrollHeight;

      // Verificar si la página tiene suficiente altura para hacer scroll
      if (documentHeight > targetY + window.innerHeight || attempt >= maxAttempts) {
        window.scrollTo(0, targetY);

        // Verificar si funcionó, si no, reintentar
        setTimeout(() => {
          if (Math.abs(window.scrollY - targetY) > 50 && attempt < maxAttempts) {
            tryRestore(attempt + 1);
          } else {
            sessionStorage.removeItem(storageKey);
          }
        }, 50);
      } else {
        // El contenido aún no tiene suficiente altura, esperar y reintentar
        setTimeout(() => tryRestore(attempt + 1), 100);
      }
    };

    // Esperar un frame antes de comenzar
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        tryRestore(0);
      });
    });
  }, [isReady, storageKey]);
}
