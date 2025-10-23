import fs from 'fs';
import { parseStringPromise } from 'xml2js';

/**
 * Parser para archivos de exportación de WordPress XML
 */
export class WordPressParser {
  constructor(xmlFilePath) {
    this.xmlFilePath = xmlFilePath;
    this.projects = [];
  }

  /**
   * Parsear el archivo XML y extraer todos los proyectos
   */
  async parse() {
    const xmlContent = fs.readFileSync(this.xmlFilePath, 'utf-8');
    const result = await parseStringPromise(xmlContent);

    const items = result.rss.channel[0].item || [];

    for (const item of items) {
      // Solo procesar items de tipo "work"
      const postType = this.getPostMeta(item, 'wp:post_type');
      if (postType !== 'work') continue;

      const project = this.parseProject(item);
      this.projects.push(project);
    }

    return this.projects;
  }

  /**
   * Parsear un item individual de WordPress a formato de proyecto
   */
  parseProject(item) {
    const status = this.getField(item, 'wp:status');
    const projectYear = this.getPostMeta(item, 'project-year') || this.getPostMeta(item, 'proyect-year');

    // Convertir timestamp Unix a año
    const year = projectYear ? new Date(parseInt(projectYear) * 1000).getFullYear() : new Date().getFullYear();

    // Extraer categorías
    const categories = this.extractCategories(item);

    // Construir metadata técnica
    const technicalSheet = this.buildTechnicalSheet(item);

    const project = {
      // Campos básicos
      wpId: this.getField(item, 'wp:post_id'),
      title: this.getPostMeta(item, 'project-name') || this.getField(item, 'title'),
      slug: this.getField(item, 'wp:post_name'),
      year: year,
      status: status === 'publish' ? 'published' : status === 'draft' ? 'draft' : 'archived',

      // Contenido
      description: this.getPostMeta(item, 'data') || '', // Descripción corta
      projectDetails: this.getPostMeta(item, 'project-details') || '',
      technicalSheet: technicalSheet,

      // Metadata
      curator: this.getPostMeta(item, 'curators'),
      location: this.getPostMeta(item, 'presented-by') || this.getPostMeta(item, 'venue'),

      // Categorías
      categories: categories,

      // Datos originales de WordPress (para referencia)
      wordpress: {
        postId: this.getField(item, 'wp:post_id'),
        publishedAt: this.getField(item, 'pubDate'),
        modifiedAt: this.getField(item, 'wp:post_modified'),
        thumbnailId: this.getPostMeta(item, '_thumbnail_id'),
        videoUrl: this.getPostMeta(item, 'video') || this.getPostMeta(item, 'main-media'),
        producedBy: this.getPostMeta(item, 'produced-by'),
        collaborators: this.getPostMeta(item, 'in-collaboration-with-'),
        acknowledgments: this.getPostMeta(item, 'acknowledgments'),
      }
    };

    return project;
  }

  /**
   * Construir la ficha técnica combinando los campos custom
   */
  buildTechnicalSheet(item) {
    const parts = [];

    // Obtener los 3 campos personalizados (a, b, c)
    for (const letter of ['a', 'b', 'c']) {
      const title = this.getPostMeta(item, `data_custom_title_${letter}`);
      const value = this.getPostMeta(item, `data_custom_${letter}`);

      if (title && value) {
        parts.push(`<p><strong>${title}</strong> ${value}</p>`);
      }
    }

    // Agregar producción y colaboradores si existen
    const producedBy = this.getPostMeta(item, 'produced-by');
    if (producedBy) {
      parts.push(`<p><strong>Producido por:</strong> ${producedBy}</p>`);
    }

    const collaborators = this.getPostMeta(item, 'in-collaboration-with-');
    if (collaborators) {
      parts.push(`<p><strong>En colaboración con:</strong> ${collaborators}</p>`);
    }

    return parts.join('\n');
  }

  /**
   * Extraer categorías del item
   */
  extractCategories(item) {
    if (!item.category) return [];

    const categories = [];
    for (const cat of item.category) {
      // Solo tomar categorías del dominio "work-tags"
      if (cat.$ && cat.$.domain === 'work-tags') {
        const categoryName = cat._ || '';
        if (categoryName && !categoryName.includes('-en')) { // Evitar duplicados en inglés
          categories.push(categoryName);
        }
      }
    }

    return categories;
  }

  /**
   * Obtener un campo del item
   */
  getField(item, fieldName) {
    const parts = fieldName.split(':');
    let current = item;

    for (const part of parts) {
      if (!current[part]) return '';
      current = current[part];
    }

    if (Array.isArray(current) && current.length > 0) {
      return typeof current[0] === 'string' ? current[0] : current[0]._ || '';
    }

    return typeof current === 'string' ? current : '';
  }

  /**
   * Obtener un postmeta del item
   */
  getPostMeta(item, key) {
    if (!item['wp:postmeta']) return '';

    for (const meta of item['wp:postmeta']) {
      const metaKey = this.getField(meta, 'wp:meta_key');
      if (metaKey === key) {
        return this.getField(meta, 'wp:meta_value');
      }
    }

    return '';
  }

  /**
   * Filtrar proyectos por estado
   */
  filterByStatus(status) {
    return this.projects.filter(p => p.status === status);
  }

  /**
   * Obtener resumen de la importación
   */
  getSummary() {
    const total = this.projects.length;
    const published = this.projects.filter(p => p.status === 'published').length;
    const draft = this.projects.filter(p => p.status === 'draft').length;

    const allCategories = new Set();
    this.projects.forEach(p => {
      p.categories.forEach(c => allCategories.add(c));
    });

    return {
      total,
      published,
      draft,
      categories: Array.from(allCategories).sort(),
      years: [...new Set(this.projects.map(p => p.year))].sort(),
    };
  }
}
