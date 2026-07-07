'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook para restaurar la posición del scroll cuando el usuario regresa a una página.
 * Solo restaura si el usuario viene de una sub-página de la misma sección.
 * Si viene de otra sección (home, noticias, etc.) se resetea al top.
 *
 * @param key - Identificador único para la página (ej: 'proyectos', 'noticias', 'exposiciones')
 * @param isReady - Indica si el contenido está listo (loading === false)
 */
export function useScrollRestoration(key: string, isReady: boolean = true) {
  const hasRestored = useRef(false);
  const shouldRestore = useRef(false);
  const storageKey = `scroll-${key}`;

  // On mount, determine if we should restore based on prev-path
  useEffect(() => {
    const prevPath = sessionStorage.getItem('prev-path') || '';
    // Only restore scroll if coming back from a detail page within the same section
    shouldRestore.current = prevPath.startsWith(`/${key}/`);

    if (!shouldRestore.current) {
      // Coming from another section - clear saved scroll position
      sessionStorage.removeItem(storageKey);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!isReady || hasRestored.current || !shouldRestore.current) return;

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
