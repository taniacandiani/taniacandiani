import { getNile } from '@/db/client';

export interface AboutContent {
  id: string;
  title: string;
  content: string;
  title_en?: string;
  content_en?: string;
  lastUpdated: string;
}

export interface ContactContent {
  id: string;
  title: string;
  description: string;
  lastUpdated: string;
}

export class AboutService {
  private static async getClient() {
    return await getNile();
  }

  // Get about content
  static async get(): Promise<AboutContent | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM about_content LIMIT 1`
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      title_en: row.title_en,
      content_en: row.content_en,
      lastUpdated: row.last_updated,
    };
  }

  // Update about content
  static async update(content: Omit<AboutContent, 'id' | 'lastUpdated'>): Promise<AboutContent> {
    const nile = await this.getClient();

    // Check if content exists
    const existing = await this.get();
    const id = existing?.id || 'about-content';

    const result = await nile.db.query(
      `INSERT INTO about_content (id, title, content, title_en, content_en, last_updated)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         title_en = EXCLUDED.title_en,
         content_en = EXCLUDED.content_en,
         last_updated = NOW()
       RETURNING *`,
      [id, content.title, content.content, content.title_en ?? null, content.content_en ?? null]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      title_en: row.title_en,
      content_en: row.content_en,
      lastUpdated: row.last_updated,
    };
  }
}

export class ContactService {
  private static async getClient() {
    return await getNile();
  }

  // Get contact content
  static async get(): Promise<ContactContent | null> {
    const nile = await this.getClient();
    const result = await nile.db.query(
      `SELECT * FROM contact_content LIMIT 1`
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      title_en: row.title_en,
      description_en: row.description_en,
      lastUpdated: row.last_updated,
    };
  }

  // Update contact content
  static async update(content: Omit<ContactContent, 'id' | 'lastUpdated'>): Promise<ContactContent> {
    const nile = await this.getClient();

    // Check if content exists
    const existing = await this.get();
    const id = existing?.id || 'contact-content';

    const result = await nile.db.query(
      `INSERT INTO contact_content (id, title, description, title_en, description_en, last_updated)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         title_en = EXCLUDED.title_en,
         description_en = EXCLUDED.description_en,
         last_updated = NOW()
       RETURNING *`,
      [id, content.title, content.description, content.title_en ?? null, content.description_en ?? null]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      title_en: row.title_en,
      description_en: row.description_en,
      lastUpdated: row.last_updated,
    };
  }
}
