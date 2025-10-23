import { getNile } from '@/db/client';
import type { ExhibitionCategory } from '@/types';

export class ExhibitionCategoryService {
  private static async getClient() {
    return await getNile();
  }

  // Get all categories
  static async getAll(): Promise<ExhibitionCategory[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM exhibition_categories ORDER BY name`
    );
    return result.rows.map(row => this.rowToCategory(row));
  }

  // Get category by ID
  static async getById(id: string): Promise<ExhibitionCategory | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM exhibition_categories WHERE id = $1`,
      [id]
    );
    return result.rows.length > 0 ? this.rowToCategory(result.rows[0]) : null;
  }

  // Get category by name
  static async getByName(name: string): Promise<ExhibitionCategory | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM exhibition_categories WHERE name = $1`,
      [name]
    );
    return result.rows.length > 0 ? this.rowToCategory(result.rows[0]) : null;
  }

  // Create category
  static async create(category: Omit<ExhibitionCategory, 'id' | 'count'>): Promise<ExhibitionCategory> {
    const nile = await this.getClient();
    const id = category.name.toLowerCase().replace(/\s+/g, '-');

    const result = await nile.db.query(
      `INSERT INTO exhibition_categories (id, name, name_en, description, description_en)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        id,
        category.name,
        category.nameEn ?? null,
        category.description ?? null,
        category.descriptionEn ?? null,
      ]
    );

    return this.rowToCategory(result.rows[0]);
  }

  // Update category
  static async update(id: string, category: Partial<ExhibitionCategory>): Promise<ExhibitionCategory | null> {
    const nile = await this.getClient();

    const result = await nile.db.query(
      `UPDATE exhibition_categories SET
        name = COALESCE($2, name),
        name_en = COALESCE($3, name_en),
        description = COALESCE($4, description),
        description_en = COALESCE($5, description_en)
      WHERE id = $1
      RETURNING *`,
      [
        id,
        category.name,
        category.nameEn,
        category.description,
        category.descriptionEn,
      ]
    );

    return result.rows.length > 0 ? this.rowToCategory(result.rows[0]) : null;
  }

  // Delete category
  static async delete(id: string): Promise<boolean> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `DELETE FROM exhibition_categories WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows.length > 0;
  }

  // Update category counts based on exhibitions
  static async updateCounts(): Promise<ExhibitionCategory[]> {
    const nile = await this.getClient();

    // Get all categories
    const categoriesResult = await nile.db.query(
      `SELECT * FROM exhibition_categories`
    );

    // Update counts for each category
    for (const category of categoriesResult.rows) {
      const countResult = await nile.db.query(
        `SELECT COUNT(*) as count FROM exhibitions
         WHERE categories @> $1::jsonb AND status = 'published'`,
        [JSON.stringify([category.name])]
      );

      await nile.db.query(
        `UPDATE exhibition_categories SET count = $2 WHERE id = $1`,
        [category.id, parseInt(countResult.rows[0].count)]
      );
    }

    // Return updated categories
    const updatedResult = await nile.db.query(
      `SELECT * FROM exhibition_categories ORDER BY name`
    );

    return updatedResult.rows.map(row => this.rowToCategory(row));
  }

  // Helper: Convert DB row to Category type
  private static rowToCategory(row: any): ExhibitionCategory {
    return {
      id: row.id,
      name: row.name,
      nameEn: row.name_en,
      count: row.count || 0,
      description: row.description,
      descriptionEn: row.description_en,
    };
  }
}