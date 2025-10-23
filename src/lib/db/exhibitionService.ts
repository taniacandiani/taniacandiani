import { getNile } from '@/db/client';
import type { Exhibition } from '@/types';

export class ExhibitionService {
  private static async getClient() {
    return await getNile();
  }

  // Get all exhibitions
  static async getAll(): Promise<Exhibition[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM exhibitions
       WHERE status = 'published'
       ORDER BY start_date DESC, published_at DESC, created_at DESC`
    );
    return result.rows.map(row => this.rowToExhibition(row));
  }

  // Get all exhibitions (including drafts, for admin)
  static async getAllIncludingDrafts(): Promise<Exhibition[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM exhibitions
       ORDER BY start_date DESC, published_at DESC, created_at DESC`
    );
    return result.rows.map(row => this.rowToExhibition(row));
  }

  // Get active exhibitions (with "Activas" category)
  static async getActive(): Promise<Exhibition[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM exhibitions
       WHERE categories @> $1::jsonb AND status = 'published'
       ORDER BY start_date DESC, published_at DESC, created_at DESC`,
      [JSON.stringify(['Activas'])]
    );
    return result.rows.map(row => this.rowToExhibition(row));
  }

  // Get exhibitions by ID
  static async getById(id: string): Promise<Exhibition | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM exhibitions WHERE id = $1`,
      [id]
    );
    return result.rows.length > 0 ? this.rowToExhibition(result.rows[0]) : null;
  }

  // Get exhibition by slug
  static async getBySlug(slug: string): Promise<Exhibition | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM exhibitions WHERE slug = $1 AND status = 'published'`,
      [slug]
    );
    return result.rows.length > 0 ? this.rowToExhibition(result.rows[0]) : null;
  }

  // Get exhibitions by category
  static async getByCategory(category: string): Promise<Exhibition[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM exhibitions
       WHERE categories @> $1::jsonb AND status = 'published'
       ORDER BY start_date DESC, published_at DESC, created_at DESC`,
      [JSON.stringify([category])]
    );
    return result.rows.map(row => this.rowToExhibition(row));
  }

  // Create exhibition
  static async create(exhibition: Omit<Exhibition, 'id'>): Promise<Exhibition> {
    const nile = await this.getClient();
    const id = crypto.randomUUID();

    const result = await nile.db.query(
      `INSERT INTO exhibitions (
        id, title, content, image, slug, published_at, categories,
        venue, start_date, end_date, curator, status, tags, hero_images,
        title_en, content_en, venue_en, curator_en, external_link
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb,
        $15, $16, $17, $18, $19
      ) RETURNING *`,
      [
        id,
        exhibition.title,
        exhibition.content,
        exhibition.image ?? null,
        exhibition.slug,
        exhibition.publishedAt ?? new Date().toISOString(),
        JSON.stringify(exhibition.categories || []),
        exhibition.venue ?? null,
        exhibition.startDate ?? null,
        exhibition.endDate ?? null,
        exhibition.curator ?? null,
        exhibition.status ?? 'draft',
        JSON.stringify(exhibition.tags || []),
        JSON.stringify(exhibition.heroImages || []),
        exhibition.titleEn ?? null,
        exhibition.contentEn ?? null,
        exhibition.venueEn ?? null,
        exhibition.curatorEn ?? null,
        exhibition.externalLink ?? null,
      ]
    );

    return this.rowToExhibition(result.rows[0]);
  }

  // Update exhibition
  static async update(id: string, exhibition: Partial<Exhibition>): Promise<Exhibition | null> {
    const nile = await this.getClient();

    const result = await nile.db.query(
      `UPDATE exhibitions SET
        title = COALESCE($2, title),
        content = COALESCE($3, content),
        image = COALESCE($4, image),
        slug = COALESCE($5, slug),
        published_at = COALESCE($6, published_at),
        categories = COALESCE($7::jsonb, categories),
        venue = COALESCE($8, venue),
        start_date = COALESCE($9, start_date),
        end_date = COALESCE($10, end_date),
        curator = COALESCE($11, curator),
        status = COALESCE($12, status),
        tags = COALESCE($13::jsonb, tags),
        hero_images = COALESCE($14::jsonb, hero_images),
        title_en = COALESCE($15, title_en),
        content_en = COALESCE($16, content_en),
        venue_en = COALESCE($17, venue_en),
        curator_en = COALESCE($18, curator_en),
        external_link = COALESCE($19, external_link),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        id,
        exhibition.title,
        exhibition.content,
        exhibition.image,
        exhibition.slug,
        exhibition.publishedAt,
        exhibition.categories ? JSON.stringify(exhibition.categories) : null,
        exhibition.venue,
        exhibition.startDate,
        exhibition.endDate,
        exhibition.curator,
        exhibition.status,
        exhibition.tags ? JSON.stringify(exhibition.tags) : null,
        exhibition.heroImages ? JSON.stringify(exhibition.heroImages) : null,
        exhibition.titleEn,
        exhibition.contentEn,
        exhibition.venueEn,
        exhibition.curatorEn,
        exhibition.externalLink,
      ]
    );

    return result.rows.length > 0 ? this.rowToExhibition(result.rows[0]) : null;
  }

  // Delete exhibition
  static async delete(id: string): Promise<boolean> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `DELETE FROM exhibitions WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows.length > 0;
  }

  // Helper: Convert DB row to Exhibition type
  private static rowToExhibition(row: any): Exhibition {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      image: row.image,
      slug: row.slug,
      publishedAt: row.published_at,
      categories: row.categories || [],
      venue: row.venue,
      startDate: row.start_date,
      endDate: row.end_date,
      curator: row.curator,
      status: row.status,
      tags: row.tags || [],
      heroImages: row.hero_images || [],
      titleEn: row.title_en,
      contentEn: row.content_en,
      venueEn: row.venue_en,
      curatorEn: row.curator_en,
      externalLink: row.external_link,
    };
  }
}