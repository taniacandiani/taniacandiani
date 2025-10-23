import { getNile } from '@/db/client';

// Note: Use AboutContent from @/types instead
import type { AboutContent } from '@/types';

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

      // PDF Downloads
      cv_pdf: row.cv_pdf,
      cv_pdf_en: row.cv_pdf_en,
      cv_button_text: row.cv_button_text,
      cv_button_text_en: row.cv_button_text_en,

      bio_pdf: row.bio_pdf,
      bio_pdf_en: row.bio_pdf_en,
      bio_button_text: row.bio_button_text,
      bio_button_text_en: row.bio_button_text_en,

      portfolio_pdf: row.portfolio_pdf,
      portfolio_pdf_en: row.portfolio_pdf_en,
      portfolio_button_text: row.portfolio_button_text,
      portfolio_button_text_en: row.portfolio_button_text_en,

      // Additional Section
      additional_title: row.additional_title,
      additional_title_en: row.additional_title_en,
      additional_content: row.additional_content,
      additional_content_en: row.additional_content_en,

      lastUpdated: row.last_updated,
    };
  }

  // Update about content
  static async update(content: Partial<AboutContent>): Promise<AboutContent> {
    const nile = await this.getClient();

    // Check if content exists
    const existing = await this.get();
    const id = existing?.id || 'about-content';

    const result = await nile.db.query(
      `INSERT INTO about_content (
        id, title, content, title_en, content_en,
        cv_pdf, cv_pdf_en, cv_button_text, cv_button_text_en,
        bio_pdf, bio_pdf_en, bio_button_text, bio_button_text_en,
        portfolio_pdf, portfolio_pdf_en, portfolio_button_text, portfolio_button_text_en,
        additional_title, additional_title_en, additional_content, additional_content_en,
        last_updated
      )
       VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20, $21,
        NOW()
      )
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         title_en = EXCLUDED.title_en,
         content_en = EXCLUDED.content_en,
         cv_pdf = EXCLUDED.cv_pdf,
         cv_pdf_en = EXCLUDED.cv_pdf_en,
         cv_button_text = EXCLUDED.cv_button_text,
         cv_button_text_en = EXCLUDED.cv_button_text_en,
         bio_pdf = EXCLUDED.bio_pdf,
         bio_pdf_en = EXCLUDED.bio_pdf_en,
         bio_button_text = EXCLUDED.bio_button_text,
         bio_button_text_en = EXCLUDED.bio_button_text_en,
         portfolio_pdf = EXCLUDED.portfolio_pdf,
         portfolio_pdf_en = EXCLUDED.portfolio_pdf_en,
         portfolio_button_text = EXCLUDED.portfolio_button_text,
         portfolio_button_text_en = EXCLUDED.portfolio_button_text_en,
         additional_title = EXCLUDED.additional_title,
         additional_title_en = EXCLUDED.additional_title_en,
         additional_content = EXCLUDED.additional_content,
         additional_content_en = EXCLUDED.additional_content_en,
         last_updated = NOW()
       RETURNING *`,
      [
        id,
        content.title,
        content.content,
        content.title_en ?? null,
        content.content_en ?? null,
        content.cv_pdf ?? null,
        content.cv_pdf_en ?? null,
        content.cv_button_text ?? null,
        content.cv_button_text_en ?? null,
        content.bio_pdf ?? null,
        content.bio_pdf_en ?? null,
        content.bio_button_text ?? null,
        content.bio_button_text_en ?? null,
        content.portfolio_pdf ?? null,
        content.portfolio_pdf_en ?? null,
        content.portfolio_button_text ?? null,
        content.portfolio_button_text_en ?? null,
        content.additional_title ?? null,
        content.additional_title_en ?? null,
        content.additional_content ?? null,
        content.additional_content_en ?? null,
      ]
    );

    return this.get() as Promise<AboutContent>;
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
