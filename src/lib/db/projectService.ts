import { getNile } from '@/db/client';
import type { Project, ProjectTab } from '@/types';

export class ProjectService {
  private static async getClient() {
    return await getNile();
  }

  // Get all projects with tabs
  static async getAll(): Promise<Project[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM projects
       ORDER BY year DESC, created_at DESC`
    );

    // Get tabs for all projects
    const projects = await Promise.all(
      result.rows.map(async (row) => {
        const project = this.rowToProject(row);
        project.tabs = await this.getProjectTabs(project.id);
        return project;
      })
    );

    return projects;
  }

  // Get project by ID with tabs
  static async getById(id: string): Promise<Project | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM projects WHERE id = $1`,
      [id]
    );
    if (result.rows.length > 0) {
      const project = this.rowToProject(result.rows[0]);
      project.tabs = await this.getProjectTabs(project.id);
      return project;
    }
    return null;
  }

  // Get project by slug with tabs
  static async getBySlug(slug: string): Promise<Project | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM projects WHERE slug = $1`,
      [slug]
    );
    if (result.rows.length > 0) {
      const project = this.rowToProject(result.rows[0]);
      project.tabs = await this.getProjectTabs(project.id);
      return project;
    }
    return null;
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

  // Create project with tabs
  static async create(project: Omit<Project, 'id'>): Promise<Project> {
    console.log('ProjectService.create called with:', {
      title: project.title,
      categories: project.categories,
      showInHomeHero: project.showInHomeHero,
      hasTabs: !!project.tabs?.length
    });

    const nile = await this.getClient();
    const id = crypto.randomUUID();
    console.log('Generated ID:', id);

    console.log('About to execute INSERT query with values:', {
      id,
      title: project.title,
      categories: JSON.stringify(project.categories || []),
      showInHomeHero: project.showInHomeHero || false,
    });

    // Log all values being sent to DB
    const queryValues = [
      id,
      project.title,
      project.image || null,
      project.year ?? null,
      project.description || null,
      project.slug,
      JSON.stringify(project.categories || []),
      JSON.stringify(project.tags || []),
      project.featured ?? false,
      project.status || 'draft',
      JSON.stringify(project.heroImages || []),
      JSON.stringify(project.heroImageDescriptions || []),
      JSON.stringify(project.heroImageDescriptions_en || []),
      project.showInHomeHero ?? false,
      project.heroDescription || null,
      project.projectDetails || null,
      project.technicalSheet || null,
      project.downloadLink || null,
      project.additionalImage || null,
      project.commissionedBy || null,
      project.curator || null,
      project.location || null,
      project.title_en || null,
      project.description_en || null,
      project.projectDetails_en || null,
      project.technicalSheet_en || null,
      project.heroDescription_en || null,
      project.commissionedBy_en || null,
      project.curator_en || null,
      project.location_en || null,
      project.createdAt || null, // Allow custom createdAt
    ];

    // Verificar que no haya valores undefined
    const hasUndefined = queryValues.some((val, idx) => {
      if (val === undefined) {
        console.error(`ERROR: Value at index ${idx} is undefined!`);
        console.error(`Field mapping: ${['id','title','image','year','description','slug','categories','tags','featured','status','hero_images','hero_image_descriptions','hero_image_descriptions_en','show_in_home_hero','hero_description','project_details','technical_sheet','download_link','additional_image','commissioned_by','curator','location','title_en','description_en','project_details_en','technical_sheet_en','hero_description_en','commissioned_by_en','curator_en','location_en','created_at'][idx]}`);
        return true;
      }
      return false;
    });

    if (hasUndefined) {
      throw new Error('Cannot insert undefined values into database. Check logs for details.');
    }

    console.log('Query values array (first 10):', queryValues.slice(0, 10));
    console.log('Query values array (10-20):', queryValues.slice(10, 20));
    console.log('Query values array (20-30):', queryValues.slice(20, 30));

    try {
      const result = await nile.db.query(
      `INSERT INTO projects (
        id, title, image, year, description, slug, categories, tags,
        featured, status, hero_images, hero_image_descriptions, hero_image_descriptions_en,
        show_in_home_hero, hero_description,
        project_details, technical_sheet, download_link, additional_image,
        commissioned_by, curator, location,
        title_en, description_en, project_details_en,
        technical_sheet_en, hero_description_en, commissioned_by_en,
        curator_en, location_en, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb,
        $9, $10, $11::jsonb, $12::jsonb, $13::jsonb,
        $14, $15,
        $16, $17, $18, $19,
        $20, $21, $22,
        $23, $24, $25,
        $26, $27, $28,
        $29, $30, COALESCE($31, NOW())
      ) RETURNING *`,
      queryValues
      );

      console.log('INSERT query executed successfully');
      console.log('Result rows:', result.rows.length);

      const createdProject = this.rowToProject(result.rows[0]);
      console.log('Project created with ID:', createdProject.id);

      // Create tabs if provided
      if (project.tabs && project.tabs.length > 0) {
        console.log(`Creating ${project.tabs.length} tabs for project ${id}`);
        await this.createProjectTabs(id, project.tabs);
        createdProject.tabs = await this.getProjectTabs(id);
        console.log('Tabs created successfully');
      }

      return createdProject;
    } catch (dbError: any) {
      console.error('DATABASE ERROR in ProjectService.create:');
      console.error('Error message:', dbError?.message || dbError);
      console.error('Error code:', dbError?.code);
      console.error('Error detail:', dbError?.detail);
      console.error('Error hint:', dbError?.hint);
      console.error('Full error object:', JSON.stringify(dbError, null, 2));

      // Si es un error de Nile/PostgreSQL, mostremos más detalles
      if (dbError?.severity) {
        console.error('PostgreSQL error severity:', dbError.severity);
        console.error('PostgreSQL error position:', dbError.position);
        console.error('PostgreSQL error column:', dbError.column);
      }

      throw dbError;
    }
  }

  // Update project with tabs
  static async update(id: string, project: Partial<Project>): Promise<Project | null> {
    const nile = await this.getClient();

    const result = await nile.db.query(
      `UPDATE projects SET
        title = COALESCE($2, title),
        image = COALESCE($3, image),
        year = COALESCE($4, year),
        description = COALESCE($5, description),
        slug = COALESCE($6, slug),
        categories = COALESCE($7::jsonb, categories),
        tags = COALESCE($8::jsonb, tags),
        featured = COALESCE($9, featured),
        status = COALESCE($10, status),
        hero_images = COALESCE($11::jsonb, hero_images),
        hero_image_descriptions = COALESCE($12::jsonb, hero_image_descriptions),
        hero_image_descriptions_en = COALESCE($13::jsonb, hero_image_descriptions_en),
        show_in_home_hero = COALESCE($14, show_in_home_hero),
        hero_description = COALESCE($15, hero_description),
        project_details = COALESCE($16, project_details),
        technical_sheet = COALESCE($17, technical_sheet),
        download_link = COALESCE($18, download_link),
        additional_image = COALESCE($19, additional_image),
        commissioned_by = COALESCE($20, commissioned_by),
        curator = COALESCE($21, curator),
        location = COALESCE($22, location),
        title_en = COALESCE($23, title_en),
        description_en = COALESCE($24, description_en),
        project_details_en = COALESCE($25, project_details_en),
        technical_sheet_en = COALESCE($26, technical_sheet_en),
        hero_description_en = COALESCE($27, hero_description_en),
        commissioned_by_en = COALESCE($28, commissioned_by_en),
        curator_en = COALESCE($29, curator_en),
        location_en = COALESCE($30, location_en),
        created_at = COALESCE($31, created_at),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        id,
        project.title,
        project.image,
        project.year,
        project.description,
        project.slug,
        project.categories ? JSON.stringify(project.categories) : null,
        project.tags ? JSON.stringify(project.tags) : null,
        project.featured,
        project.status,
        project.heroImages ? JSON.stringify(project.heroImages) : null,
        project.heroImageDescriptions ? JSON.stringify(project.heroImageDescriptions) : null,
        project.heroImageDescriptions_en ? JSON.stringify(project.heroImageDescriptions_en) : null,
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
        project.description_en,
        project.projectDetails_en,
        project.technicalSheet_en,
        project.heroDescription_en,
        project.commissionedBy_en,
        project.curator_en,
        project.location_en,
        project.createdAt,
      ]
    );

    if (result.rows.length > 0) {
      // Update tabs if provided
      if (project.tabs !== undefined) {
        await this.updateProjectTabs(id, project.tabs);
      }

      const updatedProject = this.rowToProject(result.rows[0]);
      updatedProject.tabs = await this.getProjectTabs(id);
      return updatedProject;
    }

    return null;
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
      image: row.image,
      year: row.year,
      description: row.description,
      slug: row.slug,
      categories: row.categories || [],
      tags: row.tags || [],
      featured: row.featured,
      status: row.status,
      heroImages: row.hero_images || [],
      heroImageDescriptions: row.hero_image_descriptions || [],
      heroImageDescriptions_en: row.hero_image_descriptions_en || [],
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
      description_en: row.description_en,
      projectDetails_en: row.project_details_en,
      technicalSheet_en: row.technical_sheet_en,
      heroDescription_en: row.hero_description_en,
      commissionedBy_en: row.commissioned_by_en,
      curator_en: row.curator_en,
      location_en: row.location_en,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tabs: [], // Will be populated separately
    };
  }

  // Get tabs for a project
  static async getProjectTabs(projectId: string): Promise<ProjectTab[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM project_tabs
       WHERE project_id = $1
       ORDER BY tab_order ASC`,
      [projectId]
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      tabOrder: row.tab_order,
      title: row.title,
      heroImages: row.hero_images || [],
      heroImageDescriptions: row.hero_image_descriptions || [],
      heroImageDescriptions_en: row.hero_image_descriptions_en || [],
      additionalImage: row.additional_image,
      projectDetails: row.project_details,
      technicalSheet: row.technical_sheet,
      title_en: row.title_en,
      projectDetails_en: row.project_details_en,
      technicalSheet_en: row.technical_sheet_en,
    }));
  }

  // Create tabs for a project
  static async createProjectTabs(projectId: string, tabs: ProjectTab[]): Promise<void> {
    const nile = await this.getClient();

    for (const tab of tabs) {
      await nile.db.query(
        `INSERT INTO project_tabs (
          id, project_id, tab_order, title,
          hero_images, hero_image_descriptions, hero_image_descriptions_en,
          additional_image, project_details, technical_sheet,
          title_en, project_details_en, technical_sheet_en
        ) VALUES (
          $1, $2, $3, $4,
          $5::jsonb, $6::jsonb, $7::jsonb,
          $8, $9, $10,
          $11, $12, $13
        )`,
        [
          crypto.randomUUID(),
          projectId,
          tab.tabOrder,
          tab.title,
          JSON.stringify(tab.heroImages || []),
          JSON.stringify(tab.heroImageDescriptions || []),
          JSON.stringify(tab.heroImageDescriptions_en || []),
          tab.additionalImage || null,
          tab.projectDetails || null,
          tab.technicalSheet || null,
          tab.title_en || null,
          tab.projectDetails_en || null,
          tab.technicalSheet_en || null,
        ]
      );
    }
  }

  // Update tabs for a project (delete and recreate)
  static async updateProjectTabs(projectId: string, tabs: ProjectTab[]): Promise<void> {
    const nile = await this.getClient();

    // Delete existing tabs
    await nile.db.query(
      `DELETE FROM project_tabs WHERE project_id = $1`,
      [projectId]
    );

    // Create new tabs
    if (tabs && tabs.length > 0) {
      await this.createProjectTabs(projectId, tabs);
    }
  }
}
