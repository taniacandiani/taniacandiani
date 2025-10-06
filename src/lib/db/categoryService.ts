import { getNile } from '@/db/client';
import type { ProjectCategory, NewsCategory } from '@/types';

export class ProjectCategoryService {
  private static async getClient() {
    return await getNile();
  }

  // Get all categories
  static async getAll(): Promise<ProjectCategory[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM project_categories ORDER BY name ASC`
    );
    return result.rows.map(row => this.rowToCategory(row));
  }

  // Get category by ID
  static async getById(id: string): Promise<ProjectCategory | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM project_categories WHERE id = $1`,
      [id]
    );
    return result.rows.length > 0 ? this.rowToCategory(result.rows[0]) : null;
  }

  // Create category
  static async create(category: Omit<ProjectCategory, 'id'>): Promise<ProjectCategory> {
    const nile = await this.getClient();
    const id = crypto.randomUUID();

    const result = await nile.db.query(
      `INSERT INTO project_categories (id, name, name_en, description, description_en, count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [id, category.name, category.nameEn || null, category.description || null, category.descriptionEn || null, category.count || 0]
    );

    return this.rowToCategory(result.rows[0]);
  }

  // Update category
  static async update(id: string, category: Partial<ProjectCategory>): Promise<ProjectCategory | null> {
    const nile = await this.getClient();

    const result = await nile.db.query(
      `UPDATE project_categories SET
        name = COALESCE($2, name),
        name_en = COALESCE($3, name_en),
        description = COALESCE($4, description),
        description_en = COALESCE($5, description_en),
        count = COALESCE($6, count)
      WHERE id = $1
      RETURNING *`,
      [id, category.name, category.nameEn, category.description, category.descriptionEn, category.count]
    );

    return result.rows.length > 0 ? this.rowToCategory(result.rows[0]) : null;
  }

  // Delete category
  static async delete(id: string): Promise<boolean> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `DELETE FROM project_categories WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows.length > 0;
  }

  // Update category counts (useful after adding/removing projects)
  static async updateCounts(): Promise<void> {
    const nile = await this.getClient();

    // Get all categories with their counts from projects
    await nile.db.query(`
      UPDATE project_categories pc
      SET count = (
        SELECT COUNT(DISTINCT p.id)
        FROM projects p
        WHERE p.categories @> jsonb_build_array(pc.name)
      )
    `);
  }

  // Helper: Convert DB row to ProjectCategory type
  private static rowToCategory(row: any): ProjectCategory {
    return {
      id: row.id,
      name: row.name,
      nameEn: row.name_en,
      description: row.description,
      descriptionEn: row.description_en,
      count: row.count,
    };
  }
}

export class NewsCategoryService {
  private static async getClient() {
    return await getNile();
  }

  // Get all categories
  static async getAll(): Promise<NewsCategory[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM news_categories ORDER BY name ASC`
    );
    return result.rows.map(row => this.rowToCategory(row));
  }

  // Get category by ID
  static async getById(id: string): Promise<NewsCategory | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM news_categories WHERE id = $1`,
      [id]
    );
    return result.rows.length > 0 ? this.rowToCategory(result.rows[0]) : null;
  }

  // Create category
  static async create(category: Omit<NewsCategory, 'id'>): Promise<NewsCategory> {
    const nile = await this.getClient();
    const id = crypto.randomUUID();

    const result = await nile.db.query(
      `INSERT INTO news_categories (id, name, name_en, description, description_en, count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [id, category.name, category.nameEn || null, category.description || null, category.descriptionEn || null, category.count || 0]
    );

    return this.rowToCategory(result.rows[0]);
  }

  // Update category
  static async update(id: string, category: Partial<NewsCategory>): Promise<NewsCategory | null> {
    const nile = await this.getClient();

    const result = await nile.db.query(
      `UPDATE news_categories SET
        name = COALESCE($2, name),
        name_en = COALESCE($3, name_en),
        description = COALESCE($4, description),
        description_en = COALESCE($5, description_en),
        count = COALESCE($6, count)
      WHERE id = $1
      RETURNING *`,
      [id, category.name, category.nameEn, category.description, category.descriptionEn, category.count]
    );

    return result.rows.length > 0 ? this.rowToCategory(result.rows[0]) : null;
  }

  // Delete category
  static async delete(id: string): Promise<boolean> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `DELETE FROM news_categories WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows.length > 0;
  }

  // Update category counts
  static async updateCounts(): Promise<void> {
    const nile = await this.getClient();

    await nile.db.query(`
      UPDATE news_categories nc
      SET count = (
        SELECT COUNT(DISTINCT n.id)
        FROM news n
        WHERE n.categories @> jsonb_build_array(nc.name)
      )
    `);
  }

  // Helper: Convert DB row to NewsCategory type
  private static rowToCategory(row: any): NewsCategory {
    return {
      id: row.id,
      name: row.name,
      nameEn: row.name_en,
      description: row.description,
      descriptionEn: row.description_en,
      count: row.count,
    };
  }
}
