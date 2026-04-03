import { getNile } from '@/db/client';
import type { Exhibition } from '@/types';

export class ExhibitionService {
  private static async getClient() {
    return await getNile();
  }

  // Helper: Determine if exhibition is active based on dates
  private static isActiveByDates(startDate: string | null | undefined, endDate: string | null | undefined): boolean {
    if (!startDate) return false;

    const now = new Date();
    const start = new Date(startDate);

    // Check if started
    if (start > now) return false;

    // If no end date, it's permanently active
    if (!endDate) return true;

    // Check if not ended yet
    const end = new Date(endDate);
    return end >= now;
  }

  // Helper: Add or remove "Activas" category based on dates
  private static updateActivasCategory(
    categories: string[] | undefined,
    startDate: string | null | undefined,
    endDate: string | null | undefined
  ): string[] {
    const cats = categories || [];
    const isActive = this.isActiveByDates(startDate, endDate);

    // Remove "Activas" if it exists
    const withoutActivas = cats.filter(c => c !== 'Activas');

    // Add "Activas" if the exhibition is active
    if (isActive) {
      return ['Activas', ...withoutActivas];
    }

    return withoutActivas;
  }

  // Get all exhibitions
  static async getAll(): Promise<Exhibition[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM exhibitions
       WHERE status = 'published'
       ORDER BY start_date DESC, created_at DESC, published_at DESC`
    );
    return result.rows.map(row => this.rowToExhibition(row));
  }

  // Get all exhibitions (including drafts, for admin)
  static async getAllIncludingDrafts(): Promise<Exhibition[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM exhibitions
       ORDER BY start_date DESC, created_at DESC, published_at DESC`
    );
    return result.rows.map(row => this.rowToExhibition(row));
  }

  // Get active exhibitions (based on dates)
  static async getActive(): Promise<Exhibition[]> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM exhibitions
       WHERE status = 'published'
       AND start_date IS NOT NULL
       AND (end_date IS NULL OR end_date >= NOW())
       ORDER BY start_date DESC, created_at DESC, published_at DESC`
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
       ORDER BY start_date DESC, created_at DESC, published_at DESC`,
      [JSON.stringify([category])]
    );
    return result.rows.map(row => this.rowToExhibition(row));
  }

  // Create exhibition
  static async create(exhibition: Omit<Exhibition, 'id'>): Promise<Exhibition> {
    const nile = await this.getClient();
    const id = crypto.randomUUID();

    // Automatically add/remove "Activas" based on dates
    const categories = this.updateActivasCategory(
      exhibition.categories,
      exhibition.startDate,
      exhibition.endDate
    );

    const result = await nile.db.query(
      `INSERT INTO exhibitions (
        id, title, content, image, slug, published_at, categories,
        venue, start_date, end_date, curator, status, tags, hero_images,
        hero_image_contain, title_en, content_en, venue_en, curator_en, external_link, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb,
        $15, $16, $17, $18, $19, $20, COALESCE($21, NOW())
      ) RETURNING *`,
      [
        id,
        exhibition.title,
        exhibition.content,
        exhibition.image ?? null,
        exhibition.slug,
        exhibition.publishedAt ?? new Date().toISOString(),
        JSON.stringify(categories),
        exhibition.venue ?? null,
        exhibition.startDate ?? null,
        exhibition.endDate ?? null,
        exhibition.curator ?? null,
        exhibition.status ?? 'draft',
        JSON.stringify(exhibition.tags || []),
        JSON.stringify(exhibition.heroImages || []),
        exhibition.heroImageContain ?? false,
        exhibition.titleEn ?? null,
        exhibition.contentEn ?? null,
        exhibition.venueEn ?? null,
        exhibition.curatorEn ?? null,
        exhibition.externalLink ?? null,
        exhibition.createdAt ?? null,
      ]
    );

    return this.rowToExhibition(result.rows[0]);
  }

  // Update exhibition
  static async update(id: string, exhibition: Partial<Exhibition>): Promise<Exhibition | null> {
    const nile = await this.getClient();

    // Para campos opcionales, convertir cadenas vacías a null
    const emptyToNull = (value: any) => {
      if (value === '' || value === undefined) return null;
      return value;
    };

    // Automatically add/remove "Activas" based on dates
    const categories = exhibition.categories
      ? this.updateActivasCategory(
          exhibition.categories,
          exhibition.startDate,
          exhibition.endDate
        )
      : undefined;

    const result = await nile.db.query(
      `UPDATE exhibitions SET
        title = COALESCE($2, title),
        content = COALESCE($3, content),
        image = COALESCE($4, image),
        slug = COALESCE($5, slug),
        published_at = COALESCE($6, published_at),
        categories = COALESCE($7::jsonb, categories),
        venue = $8,
        start_date = $9,
        end_date = $10,
        curator = $11,
        status = COALESCE($12, status),
        tags = COALESCE($13::jsonb, tags),
        hero_images = COALESCE($14::jsonb, hero_images),
        hero_image_contain = COALESCE($15, hero_image_contain),
        title_en = $16,
        content_en = $17,
        venue_en = $18,
        curator_en = $19,
        external_link = $20,
        created_at = COALESCE($21, created_at),
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
        categories ? JSON.stringify(categories) : null,
        emptyToNull(exhibition.venue),
        emptyToNull(exhibition.startDate),
        emptyToNull(exhibition.endDate),
        emptyToNull(exhibition.curator),
        exhibition.status,
        exhibition.tags ? JSON.stringify(exhibition.tags) : null,
        exhibition.heroImages ? JSON.stringify(exhibition.heroImages) : null,
        exhibition.heroImageContain ?? null,
        emptyToNull(exhibition.titleEn),
        emptyToNull(exhibition.contentEn),
        emptyToNull(exhibition.venueEn),
        emptyToNull(exhibition.curatorEn),
        emptyToNull(exhibition.externalLink),
        exhibition.createdAt,
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
      heroImageContain: row.hero_image_contain ?? false,
      titleEn: row.title_en,
      contentEn: row.content_en,
      venueEn: row.venue_en,
      curatorEn: row.curator_en,
      externalLink: row.external_link,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}