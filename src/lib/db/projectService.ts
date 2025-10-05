import { getNile } from '@/db/client';
import type { Project } from '@/types';

export class ProjectService {
  private static async getClient() {
    return await getNile();
  }

  // Get all projects
  static async getAll(): Promise<Project[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM projects
       ORDER BY year DESC, created_at DESC`
    );
    return result.rows.map(row => this.rowToProject(row));
  }

  // Get project by ID
  static async getById(id: string): Promise<Project | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM projects WHERE id = $1`,
      [id]
    );
    return result.rows.length > 0 ? this.rowToProject(result.rows[0]) : null;
  }

  // Get project by slug
  static async getBySlug(slug: string): Promise<Project | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM projects WHERE slug = $1`,
      [slug]
    );
    return result.rows.length > 0 ? this.rowToProject(result.rows[0]) : null;
  }

  // Get projects by category
  static async getByCategory(category: string): Promise<Project[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM projects
       WHERE categories @> $1::jsonb
       ORDER BY year DESC, created_at DESC`,
      [JSON.stringify([category])]
    );
    return result.rows.map(row => this.rowToProject(row));
  }

  // Get featured projects
  static async getFeatured(): Promise<Project[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM projects
       WHERE featured = true AND status = 'published'
       ORDER BY year DESC, created_at DESC`
    );
    return result.rows.map(row => this.rowToProject(row));
  }

  // Get hero projects (for homepage)
  static async getHeroProjects(): Promise<Project[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM projects
       WHERE show_in_home_hero = true AND status = 'published'
       ORDER BY year DESC, created_at DESC`
    );
    return result.rows.map(row => this.rowToProject(row));
  }

  // Create project
  static async create(project: Omit<Project, 'id'>): Promise<Project> {
    const nile = await this.getClient();
    const id = crypto.randomUUID();

    const result = await nile.db.query(
      `INSERT INTO projects (
        id, title, subtitle, image, year, description, slug, categories, tags,
        featured, status, hero_images, show_in_home_hero, hero_description,
        project_details, technical_sheet, download_link, additional_image,
        commissioned_by, curator, location,
        title_en, subtitle_en, description_en, project_details_en,
        technical_sheet_en, hero_description_en, commissioned_by_en,
        curator_en, location_en
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb,
        $10, $11, $12::jsonb, $13, $14,
        $15, $16, $17, $18,
        $19, $20, $21,
        $22, $23, $24, $25,
        $26, $27, $28,
        $29, $30
      ) RETURNING *`,
      [
        id,
        project.title,
        project.subtitle || null,
        project.image,
        project.year,
        project.description,
        project.slug,
        JSON.stringify(project.categories || []),
        JSON.stringify(project.tags || []),
        project.featured || false,
        project.status || 'draft',
        JSON.stringify(project.heroImages || []),
        project.showInHomeHero || false,
        project.heroDescription || null,
        project.projectDetails || null,
        project.technicalSheet || null,
        project.downloadLink || null,
        project.additionalImage || null,
        project.commissionedBy || null,
        project.curator || null,
        project.location || null,
        project.title_en || null,
        project.subtitle_en || null,
        project.description_en || null,
        project.projectDetails_en || null,
        project.technicalSheet_en || null,
        project.heroDescription_en || null,
        project.commissionedBy_en || null,
        project.curator_en || null,
        project.location_en || null,
      ]
    );

    return this.rowToProject(result.rows[0]);
  }

  // Update project
  static async update(id: string, project: Partial<Project>): Promise<Project | null> {
    const nile = await this.getClient();

    const result = await nile.db.query(
      `UPDATE projects SET
        title = COALESCE($2, title),
        subtitle = COALESCE($3, subtitle),
        image = COALESCE($4, image),
        year = COALESCE($5, year),
        description = COALESCE($6, description),
        slug = COALESCE($7, slug),
        categories = COALESCE($8::jsonb, categories),
        tags = COALESCE($9::jsonb, tags),
        featured = COALESCE($10, featured),
        status = COALESCE($11, status),
        hero_images = COALESCE($12::jsonb, hero_images),
        show_in_home_hero = COALESCE($13, show_in_home_hero),
        hero_description = COALESCE($14, hero_description),
        project_details = COALESCE($15, project_details),
        technical_sheet = COALESCE($16, technical_sheet),
        download_link = COALESCE($17, download_link),
        additional_image = COALESCE($18, additional_image),
        commissioned_by = COALESCE($19, commissioned_by),
        curator = COALESCE($20, curator),
        location = COALESCE($21, location),
        title_en = COALESCE($22, title_en),
        subtitle_en = COALESCE($23, subtitle_en),
        description_en = COALESCE($24, description_en),
        project_details_en = COALESCE($25, project_details_en),
        technical_sheet_en = COALESCE($26, technical_sheet_en),
        hero_description_en = COALESCE($27, hero_description_en),
        commissioned_by_en = COALESCE($28, commissioned_by_en),
        curator_en = COALESCE($29, curator_en),
        location_en = COALESCE($30, location_en),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        id,
        project.title,
        project.subtitle,
        project.image,
        project.year,
        project.description,
        project.slug,
        project.categories ? JSON.stringify(project.categories) : null,
        project.tags ? JSON.stringify(project.tags) : null,
        project.featured,
        project.status,
        project.heroImages ? JSON.stringify(project.heroImages) : null,
        project.showInHomeHero,
        project.heroDescription,
        project.projectDetails,
        project.technicalSheet,
        project.downloadLink,
        project.additionalImage,
        project.commissionedBy,
        project.curator,
        project.location,
        project.title_en,
        project.subtitle_en,
        project.description_en,
        project.projectDetails_en,
        project.technicalSheet_en,
        project.heroDescription_en,
        project.commissionedBy_en,
        project.curator_en,
        project.location_en,
      ]
    );

    return result.rows.length > 0 ? this.rowToProject(result.rows[0]) : null;
  }

  // Delete project
  static async delete(id: string): Promise<boolean> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `DELETE FROM projects WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows.length > 0;
  }

  // Helper: Convert DB row to Project type
  private static rowToProject(row: any): Project {
    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      image: row.image,
      year: row.year,
      description: row.description,
      slug: row.slug,
      categories: row.categories || [],
      tags: row.tags || [],
      featured: row.featured,
      status: row.status,
      heroImages: row.hero_images || [],
      showInHomeHero: row.show_in_home_hero,
      heroDescription: row.hero_description,
      projectDetails: row.project_details,
      technicalSheet: row.technical_sheet,
      downloadLink: row.download_link,
      additionalImage: row.additional_image,
      commissionedBy: row.commissioned_by,
      curator: row.curator,
      location: row.location,
      title_en: row.title_en,
      subtitle_en: row.subtitle_en,
      description_en: row.description_en,
      projectDetails_en: row.project_details_en,
      technicalSheet_en: row.technical_sheet_en,
      heroDescription_en: row.hero_description_en,
      commissionedBy_en: row.commissioned_by_en,
      curator_en: row.curator_en,
      location_en: row.location_en,
    };
  }
}
