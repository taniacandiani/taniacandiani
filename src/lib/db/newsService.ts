import { getNile } from '@/db/client';
import type { NewsItem } from '@/types';

export class NewsService {
  private static async getClient() {
    return await getNile();
  }

  // Get all news
  static async getAll(): Promise<NewsItem[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM news
       WHERE status = 'published'
       ORDER BY published_at DESC, created_at DESC`
    );
    return result.rows.map(row => this.rowToNews(row));
  }

  // Get all news (including drafts, for admin)
  static async getAllIncludingDrafts(): Promise<NewsItem[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM news
       ORDER BY published_at DESC, created_at DESC`
    );
    return result.rows.map(row => this.rowToNews(row));
  }

  // Get news by ID
  static async getById(id: string): Promise<NewsItem | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM news WHERE id = $1`,
      [id]
    );
    return result.rows.length > 0 ? this.rowToNews(result.rows[0]) : null;
  }

  // Get news by slug
  static async getBySlug(slug: string): Promise<NewsItem | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM news WHERE slug = $1 AND status = 'published'`,
      [slug]
    );
    return result.rows.length > 0 ? this.rowToNews(result.rows[0]) : null;
  }

  // Get news by category
  static async getByCategory(category: string): Promise<NewsItem[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM news
       WHERE categories @> $1::jsonb AND status = 'published'
       ORDER BY published_at DESC, created_at DESC`,
      [JSON.stringify([category])]
    );
    return result.rows.map(row => this.rowToNews(row));
  }

  // Create news
  static async create(news: Omit<NewsItem, 'id'>): Promise<NewsItem> {
    const nile = await this.getClient();
    const id = crypto.randomUUID();

    const result = await nile.db.query(
      `INSERT INTO news (
        id, title, content, image, slug, published_at, categories,
        author, status, tags, hero_images
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10::jsonb, $11::jsonb
      ) RETURNING *`,
      [
        id,
        news.title,
        news.content,
        news.image || null,
        news.slug,
        news.publishedAt || new Date().toISOString(),
        JSON.stringify(news.categories || []),
        news.author || null,
        news.status || 'draft',
        JSON.stringify(news.tags || []),
        JSON.stringify(news.heroImages || []),
      ]
    );

    return this.rowToNews(result.rows[0]);
  }

  // Update news
  static async update(id: string, news: Partial<NewsItem>): Promise<NewsItem | null> {
    const nile = await this.getClient();

    const result = await nile.db.query(
      `UPDATE news SET
        title = COALESCE($2, title),
        content = COALESCE($3, content),
        image = COALESCE($4, image),
        slug = COALESCE($5, slug),
        published_at = COALESCE($6, published_at),
        categories = COALESCE($7::jsonb, categories),
        author = COALESCE($8, author),
        status = COALESCE($9, status),
        tags = COALESCE($10::jsonb, tags),
        hero_images = COALESCE($11::jsonb, hero_images),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *`,
      [
        id,
        news.title,
        news.content,
        news.image,
        news.slug,
        news.publishedAt,
        news.categories ? JSON.stringify(news.categories) : null,
        news.author,
        news.status,
        news.tags ? JSON.stringify(news.tags) : null,
        news.heroImages ? JSON.stringify(news.heroImages) : null,
      ]
    );

    return result.rows.length > 0 ? this.rowToNews(result.rows[0]) : null;
  }

  // Delete news
  static async delete(id: string): Promise<boolean> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `DELETE FROM news WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows.length > 0;
  }

  // Helper: Convert DB row to NewsItem type
  private static rowToNews(row: any): NewsItem {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      image: row.image,
      slug: row.slug,
      publishedAt: row.published_at,
      categories: row.categories || [],
      author: row.author,
      status: row.status,
      tags: row.tags || [],
      heroImages: row.hero_images || [],
    };
  }
}
