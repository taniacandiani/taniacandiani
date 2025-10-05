import { getNile } from '@/db/client';
import type { Publication } from '@/types';

export class PublicationService {
  private static async getClient() {
    return await getNile();
  }

  // Get all publications
  static async getAll(): Promise<Publication[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM publications
       WHERE status = 'published'
       ORDER BY published_at DESC, created_at DESC`
    );
    return result.rows.map(row => this.rowToPublication(row));
  }

  // Get all publications (including drafts, for admin)
  static async getAllIncludingDrafts(): Promise<Publication[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM publications
       ORDER BY published_at DESC, created_at DESC`
    );
    return result.rows.map(row => this.rowToPublication(row));
  }

  // Get publication by ID
  static async getById(id: string): Promise<Publication | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM publications WHERE id = $1`,
      [id]
    );
    return result.rows.length > 0 ? this.rowToPublication(result.rows[0]) : null;
  }

  // Create publication
  static async create(publication: Omit<Publication, 'id'>): Promise<Publication> {
    const nile = await this.getClient();
    const id = crypto.randomUUID();

    const result = await nile.db.query(
      `INSERT INTO publications (
        id, title, description, thumbnail, download_link, published_at, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        publication.title,
        publication.description || null,
        publication.thumbnail || null,
        publication.downloadLink || null,
        publication.publishedAt || new Date().toISOString(),
        publication.status || 'draft',
      ]
    );

    return this.rowToPublication(result.rows[0]);
  }

  // Update publication
  static async update(id: string, publication: Partial<Publication>): Promise<Publication | null> {
    const nile = await this.getClient();

    const result = await nile.db.query(
      `UPDATE publications SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        thumbnail = COALESCE($4, thumbnail),
        download_link = COALESCE($5, download_link),
        published_at = COALESCE($6, published_at),
        status = COALESCE($7, status),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        id,
        publication.title,
        publication.description,
        publication.thumbnail,
        publication.downloadLink,
        publication.publishedAt,
        publication.status,
      ]
    );

    return result.rows.length > 0 ? this.rowToPublication(result.rows[0]) : null;
  }

  // Delete publication
  static async delete(id: string): Promise<boolean> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `DELETE FROM publications WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows.length > 0;
  }

  // Helper: Convert DB row to Publication type
  private static rowToPublication(row: any): Publication {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      thumbnail: row.thumbnail,
      downloadLink: row.download_link,
      publishedAt: row.published_at,
      status: row.status,
    };
  }
}
