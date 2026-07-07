'use client';

import { Skeleton } from './Skeleton';

// Esqueletos de página: reemplazan al spinner («bolita de carga») para que
// mientras llegan los datos se vea la estructura de la página en gris.

// Para páginas de listado (proyectos, noticias, exposiciones)
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="container-mobile py-8 pt-16 lg:pt-24">
      <Skeleton variant="text" height={40} width={280} className="mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-[2/1]">
              <Skeleton height="100%" />
            </div>
            <Skeleton variant="text" height={14} width="50%" />
            <Skeleton variant="text" height={22} width="80%" />
            <Skeleton variant="text" height={14} />
            <Skeleton variant="text" height={14} width="70%" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Para páginas de detalle (proyecto, noticia, exposición)
export function DetailSkeleton() {
  return (
    <div className="container-mobile py-4 lg:py-8 pt-12 lg:pt-24">
      <div className="aspect-[4/3] md:aspect-[16/6] mb-8">
        <Skeleton height="100%" />
      </div>
      <Skeleton variant="text" height={14} width={240} className="mb-6" />
      <Skeleton variant="text" height={48} width="60%" className="mb-4" />
      <Skeleton variant="text" height={16} width={320} className="mb-8" />
      <div className="space-y-3 max-w-3xl">
        <Skeleton variant="text" height={16} />
        <Skeleton variant="text" height={16} />
        <Skeleton variant="text" height={16} width="85%" />
        <Skeleton variant="text" height={16} width="70%" />
      </div>
    </div>
  );
}

// Para páginas de texto (acerca, contacto)
export function TextPageSkeleton() {
  return (
    <div className="container-mobile py-8 pt-16 lg:pt-24">
      <Skeleton variant="text" height={40} width={280} className="mb-8" />
      <div className="space-y-3 max-w-3xl">
        <Skeleton variant="text" height={16} />
        <Skeleton variant="text" height={16} />
        <Skeleton variant="text" height={16} width="85%" />
        <Skeleton variant="text" height={16} />
        <Skeleton variant="text" height={16} width="70%" />
      </div>
    </div>
  );
}
