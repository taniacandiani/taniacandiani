# Funcionalidad de Generación de PDF para Proyectos

## Descripción

Se ha implementado una funcionalidad de generación dinámica de PDFs para los proyectos publicados. Cuando un usuario hace clic en "Descargar PDF", el sistema genera automáticamente un documento PDF con el contenido completo del proyecto.

## Estructura del PDF

El PDF generado incluye:

### 1. **Página de Contenido Principal**
- Título del proyecto
- Ficha Técnica (convertida de HTML a texto limpio)
- Detalles del Proyecto (convertidos de HTML a texto limpio)
- Información adicional:
  - Comisionado por
  - Curador/a
  - Ubicación
  - Año
  - Categorías
- Footer: © TANIA CANDIANI

### 2. **Página de Imágenes**
- Todas las imágenes del slider principal (hero images)
- **NUEVO**: Imágenes extraídas automáticamente de "Detalles del Proyecto"
- Descripciones de cada imagen hero (si están disponibles)
- Footer: © TANIA CANDIANI

### 3. **Imagen Adicional** (si existe)
- Imagen secundaria del proyecto
- Footer: © TANIA CANDIANI

### 4. **Tabs Adicionales** (si existen)
- Para cada tab del proyecto, se repite la estructura:
  - Título del tab (con una línea inferior, no dos)
  - Ficha Técnica del tab
  - Detalles del Proyecto del tab
  - Imágenes hero del tab + imágenes extraídas de detalles
  - Imagen adicional del tab
  - Footer en cada página: © TANIA CANDIANI

## Orden de Contenido

El contenido aparece en el siguiente orden:
1. Título
2. Ficha Técnica
3. Detalles del Proyecto (sin imágenes ni videos)
4. Metadata (curador, comisionado, ubicación, categorías, año)
5. Imágenes correspondientes (hero + extraídas de detalles)

## Procesamiento Inteligente de Contenido

### Filtrado de Videos
- **Iframes removidos**: Los iframes de video (YouTube, Vimeo, etc.) se eliminan automáticamente del PDF
- Solo se incluye el texto, sin elementos multimedia no imprimibles

### Extracción de Imágenes
- **Imágenes del contenido**: Las imágenes insertadas en "Detalles del Proyecto" se extraen automáticamente
- **Unificación**: Se combinan con las imágenes hero para crear una galería completa
- **Sin duplicados**: Se eliminan URLs duplicadas para evitar repetir imágenes

## Soporte Bilingüe

El PDF se genera automáticamente en el idioma que el usuario tiene seleccionado en la página:
- **Español**: `/api/projects/{id}/pdf?lang=es`
- **Inglés**: `/api/projects/{id}/pdf?lang=en`

## Implementación Técnica

### Archivos Creados

1. **`src/components/pdf/ProjectPDF.tsx`**
   - Componente React que define la estructura del PDF
   - Usa `@react-pdf/renderer` para el diseño
   - Convierte HTML (de TipTap) a texto plano usando `html-to-text`

2. **`src/app/api/projects/[id]/pdf/route.ts`**
   - API route que genera el PDF
   - Obtiene el proyecto completo con tabs desde la base de datos
   - Renderiza el componente PDF a un stream
   - Retorna el PDF como descarga

### Archivos Modificados

1. **`src/app/proyectos/[slug]/page.tsx`**
   - Se reemplazaron los enlaces estáticos de descarga (`downloadLink`) por botones dinámicos
   - Los botones ahora llaman a la API de generación de PDF
   - Se mantienen en 3 ubicaciones:
     - Sidebar izquierdo (bajo información del proyecto)
     - Tab superior (tercer tab)
     - Navegación inferior (botón central)

### Dependencias Instaladas

```bash
npm install @react-pdf/renderer html-to-text
```

## Cómo Probar

1. **Inicia el servidor de desarrollo** (si no está corriendo):
   ```bash
   npm run dev
   ```

2. **Navega a un proyecto publicado**:
   - Ve a http://localhost:3002/proyectos
   - Haz clic en cualquier proyecto publicado

3. **Descarga el PDF**:
   - Haz clic en cualquiera de los botones "Descargar PDF"
   - El PDF se descargará automáticamente con el nombre `{slug}-{lang}.pdf`

4. **Verifica el contenido**:
   - Abre el PDF descargado
   - Verifica que incluye:
     - ✅ Título del proyecto (sin portada separada)
     - ✅ Ficha Técnica
     - ✅ Detalles del Proyecto (sin videos)
     - ✅ Metadata (curador, comisionado, ubicación, categorías)
     - ✅ Imágenes hero + imágenes extraídas del contenido
     - ✅ Footer con © TANIA CANDIANI en cada página
     - ✅ Tabs adicionales (si existen)

5. **Prueba bilingüe**:
   - Cambia el idioma del sitio (ES/EN)
   - Descarga nuevamente el PDF
   - Verifica que el contenido esté en el idioma correcto

## Características Técnicas

- ✅ **Generación server-side**: El PDF se genera en el servidor, no en el cliente
- ✅ **Imágenes desde Cloudinary**: Las imágenes se cargan directamente desde Cloudinary
- ✅ **Conversión de HTML**: El contenido rico de TipTap se convierte a texto formateado
- ✅ **Filtrado inteligente**: Elimina automáticamente iframes de video y extrae imágenes
- ✅ **Caché**: Los PDFs se cachean por 1 hora para mejorar el rendimiento
- ✅ **Restricción de seguridad**: Solo se generan PDFs para proyectos publicados
- ✅ **Diseño profesional**: Tipografía Helvetica, footer con copyright, diseño limpio
- ✅ **Compacto**: Sin página de portada para ahorrar papel

## Notas Importantes

1. **Campo `downloadLink` deprecado**: El campo `downloadLink` en la base de datos ya no se usa activamente, pero se mantiene por compatibilidad. Ahora todos los PDFs se generan dinámicamente.

2. **Proyectos sin contenido**: Si un proyecto no tiene ficha técnica o detalles, esas secciones simplemente no aparecerán en el PDF.

3. **Límite de imágenes**: No hay límite técnico en el número de imágenes, pero PDFs muy grandes pueden tardar más en generarse.

4. **Manejo de errores**: Si la generación falla, se retorna un error 500. Verifica los logs del servidor para más detalles.

## Posibles Mejoras Futuras

- [ ] Agregar tabla de contenidos
- [ ] Incluir marca de agua o logo de Tania Candiani
- [ ] Agregar numeración de páginas
- [ ] Permitir personalizar el diseño del PDF desde el admin
- [ ] Generar PDFs en batch para múltiples proyectos
