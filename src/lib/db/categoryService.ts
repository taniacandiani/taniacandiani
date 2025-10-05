import { getNile } from '@/db/client';
import type { Category } from '@/types';

export class ProjectCategoryService {
  private static async getClient() {
    return await getNile();
  }

  // Get all categories
  static async getAll(): Promise<Category[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM project_categories ORDER BY name ASC`
    );
    return result.rows.map(row => this.rowToCategory(row));
  }

  // Get category by ID
  static async getById(id: string): Promise<Category | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM project_categories WHERE id = $1`,
      [id]
    );
    return result.rows.length > 0 ? this.rowToCategory(result.rows[0]) : null;
  }

  // Create category
  static async create(category: Omit<Category, 'id'>): Promise<Category> {
    const nile = await this.getClient();
    const id = crypto.randomUUID();

    const result = await nile.db.query(
      `INSERT INTO project_categories (id, name, count, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [id, category.name, category.count || 0]
    );

    return this.rowToCategory(result.rows[0]);
  }

  // Update category
  static async update(id: string, category: Partial<Category>): Promise<Category | null> {
    const nile = await this.getClient();

    const result = await nile.db.query(
      `UPDATE project_categories SET
        name = COALESCE($2, name),
        count = COALESCE($3, count)
      WHERE id = $1
      RETURNING *`,
      [id, category.name, category.count]
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

  // Helper: Convert DB row to Category type
  private static rowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      count: row.count,
      createdAt: row.created_at,
    };
  }
}

export class NewsCategoryService {
  private static async getClient() {
    return await getNile();
  }

  // Get all categories
  static async getAll(): Promise<Category[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM news_categories ORDER BY name ASC`
    );
    return result.rows.map(row => this.rowToCategory(row));
  }

  // Get category by ID
  static async getById(id: string): Promise<Category | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM news_categories WHERE id = $1`,
      [id]
    );
    return result.rows.length > 0 ? this.rowToCategory(result.rows[0]) : null;
  }

  // Create category
  static async create(category: Omit<Category, 'id'>): Promise<Category> {
    const nile = await this.getClient();
    const id = crypto.randomUUID();

    const result = await nile.db.query(
      `INSERT INTO news_categories (id, name, count, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [id, category.name, category.count || 0]
    );

    return this.rowToCategory(result.rows[0]);
  }

  // Update category
  static async update(id: string, category: Partial<Category>): Promise<Category | null> {
    const nile = await this.getClient();

    const result = await nile.db.query(
      `UPDATE news_categories SET
        name = COALESCE($2, name),
        count = COALESCE($3, count)
      WHERE id = $1
      RETURNING *`,
      [id, category.name, category.count]
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

  // Helper: Convert DB row to Category type
  private static rowToCategory(row: any): Category {
    return {
      id: row.id,
      name: row.name,
      count: row.count,
      createdAt: row.created_at,
    };
  }
}
