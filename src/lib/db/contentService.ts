import { getNile } from '@/db/client';

export interface AboutContent {
  id: string;
  title: string;
  content: string;
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
      `INSERT INTO about_content (id, title, content, last_updated)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         last_updated = NOW()
       RETURNING *`,
      [id, content.title, content.content]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      content: row.content,
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
      `INSERT INTO contact_content (id, title, description, last_updated)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         last_updated = NOW()
       RETURNING *`,
      [id, content.title, content.description]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      lastUpdated: row.last_updated,
    };
  }
}
