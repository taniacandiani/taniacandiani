import { pgTable, varchar, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Projects Table
export const projects = pgTable('projects', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  image: text('image'),
  year: integer('year'),
  description: text('description'),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  categories: jsonb('categories').$type<string[]>(),
  tags: jsonb('tags').$type<string[]>(),
  featured: boolean('featured').default(false),
  status: varchar('status', { length: 50 }).default('draft'),

  // Hero
  heroImages: jsonb('hero_images').$type<string[]>(),
  heroImageDescriptions: jsonb('hero_image_descriptions').$type<string[]>(),
  heroImageDescriptionsEn: jsonb('hero_image_descriptions_en').$type<string[]>(),
  showInHomeHero: boolean('show_in_home_hero').default(false),
  heroDescription: text('hero_description'),
  imagesWithoutSlider: boolean('images_without_slider').default(false),
  sliderImagesContain: boolean('slider_images_contain').default(false),

  // Details
  projectDetails: text('project_details'),
  technicalSheet: text('technical_sheet'),
  downloadLink: text('download_link'),
  additionalImage: text('additional_image'),

  // PDF Document
  pdfUrl: text('pdf_url'),
  pdfButtonText: varchar('pdf_button_text', { length: 255 }),
  pdfButtonTextEn: varchar('pdf_button_text_en', { length: 255 }),

  // Video Embed
  videoUrl: text('video_url'),

  // Metadata
  commissionedBy: varchar('commissioned_by', { length: 255 }),
  curator: varchar('curator', { length: 255 }),
  location: varchar('location', { length: 255 }),

  // English translations
  titleEn: varchar('title_en', { length: 500 }),
  descriptionEn: text('description_en'),
  projectDetailsEn: text('project_details_en'),
  technicalSheetEn: text('technical_sheet_en'),
  heroDescriptionEn: text('hero_description_en'),
  commissionedByEn: varchar('commissioned_by_en', { length: 255 }),
  curatorEn: varchar('curator_en', { length: 255 }),
  locationEn: varchar('location_en', { length: 255 }),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Project Tabs Table
export const projectTabs = pgTable('project_tabs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  projectId: varchar('project_id', { length: 255 }).notNull().references(() => projects.id, { onDelete: 'cascade' }),
  tabOrder: integer('tab_order').notNull(),

  // Tab content
  title: varchar('title', { length: 500 }).notNull(),
  heroImages: jsonb('hero_images').$type<string[]>(),
  heroImageDescriptions: jsonb('hero_image_descriptions').$type<string[]>(),
  heroImageDescriptionsEn: jsonb('hero_image_descriptions_en').$type<string[]>(),
  imagesWithoutSlider: boolean('images_without_slider').default(false),
  sliderImagesContain: boolean('slider_images_contain').default(false),
  additionalImage: text('additional_image'),
  projectDetails: text('project_details'),
  technicalSheet: text('technical_sheet'),

  // PDF Document (new fields)
  pdfUrl: text('pdf_url'),
  pdfTitle: varchar('pdf_title', { length: 500 }),
  pdfTitleEn: varchar('pdf_title_en', { length: 500 }),
  pdfButtonText: varchar('pdf_button_text', { length: 255 }),
  pdfButtonTextEn: varchar('pdf_button_text_en', { length: 255 }),

  // Video Embed (new field)
  videoUrl: text('video_url'),

  // English translations
  titleEn: varchar('title_en', { length: 500 }),
  projectDetailsEn: text('project_details_en'),
  technicalSheetEn: text('technical_sheet_en'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// News Table
export const news = pgTable('news', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  image: text('image'),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  publishedAt: timestamp('published_at'),
  categories: jsonb('categories').$type<string[]>(),
  author: varchar('author', { length: 255 }),
  status: varchar('status', { length: 50 }).default('draft'),
  tags: jsonb('tags').$type<string[]>(),
  heroImages: jsonb('hero_images').$type<string[]>(),

  // English translations
  titleEn: varchar('title_en', { length: 500 }),
  contentEn: text('content_en'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Project Categories Table
export const projectCategories = pgTable('project_categories', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  nameEn: varchar('name_en', { length: 255 }),
  description: text('description'),
  descriptionEn: text('description_en'),
  count: integer('count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// News Categories Table
export const newsCategories = pgTable('news_categories', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  nameEn: varchar('name_en', { length: 255 }),
  description: text('description'),
  descriptionEn: text('description_en'),
  count: integer('count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Publications Table
export const publications = pgTable('publications', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  titleEn: varchar('title_en', { length: 500 }),
  description: text('description'),
  descriptionEn: text('description_en'),
  thumbnail: text('thumbnail'),
  downloadLink: text('download_link'),
  publishedAt: timestamp('published_at'),
  status: varchar('status', { length: 50 }).default('draft'),
  displayOrder: integer('display_order').default(0),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// About Content Table
export const aboutContent = pgTable('about_content', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 500 }),
  content: text('content'),
  title_en: varchar('title_en', { length: 500 }),
  content_en: text('content_en'),

  // PDF Downloads
  cv_pdf: text('cv_pdf'),
  cv_pdf_en: text('cv_pdf_en'),
  cv_button_text: varchar('cv_button_text', { length: 100 }),
  cv_button_text_en: varchar('cv_button_text_en', { length: 100 }),

  bio_pdf: text('bio_pdf'),
  bio_pdf_en: text('bio_pdf_en'),
  bio_button_text: varchar('bio_button_text', { length: 100 }),
  bio_button_text_en: varchar('bio_button_text_en', { length: 100 }),

  portfolio_pdf: text('portfolio_pdf'),
  portfolio_pdf_en: text('portfolio_pdf_en'),
  portfolio_button_text: varchar('portfolio_button_text', { length: 100 }),
  portfolio_button_text_en: varchar('portfolio_button_text_en', { length: 100 }),

  // Additional Section
  additional_title: varchar('additional_title', { length: 500 }),
  additional_title_en: varchar('additional_title_en', { length: 500 }),
  additional_content: text('additional_content'),
  additional_content_en: text('additional_content_en'),

  lastUpdated: timestamp('last_updated').defaultNow(),
});

// Contact Content Table
export const contactContent = pgTable('contact_content', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 500 }),
  description: text('description'),
  title_en: varchar('title_en', { length: 500 }),
  description_en: text('description_en'),
  lastUpdated: timestamp('last_updated').defaultNow(),
});

// Exhibitions Table
export const exhibitions = pgTable('exhibitions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  image: text('image'),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  publishedAt: timestamp('published_at'),
  categories: jsonb('categories').$type<string[]>(),
  venue: varchar('venue', { length: 500 }),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  curator: varchar('curator', { length: 255 }),
  status: varchar('status', { length: 50 }).default('draft'),
  tags: jsonb('tags').$type<string[]>(),
  heroImages: jsonb('hero_images').$type<string[]>(),
  externalLink: text('external_link'),

  // English translations
  titleEn: varchar('title_en', { length: 500 }),
  contentEn: text('content_en'),
  venueEn: varchar('venue_en', { length: 500 }),
  curatorEn: varchar('curator_en', { length: 255 }),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Exhibition Categories Table
export const exhibitionCategories = pgTable('exhibition_categories', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  nameEn: varchar('name_en', { length: 255 }),
  description: text('description'),
  descriptionEn: text('description_en'),
  count: integer('count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Export types
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectTab = typeof projectTabs.$inferSelect;
export type NewProjectTab = typeof projectTabs.$inferInsert;
export type News = typeof news.$inferSelect;
export type NewNews = typeof news.$inferInsert;
export type ProjectCategory = typeof projectCategories.$inferSelect;
export type NewsCategory = typeof newsCategories.$inferSelect;
export type Publication = typeof publications.$inferSelect;
export type AboutContent = typeof aboutContent.$inferSelect;
export type ContactContent = typeof contactContent.$inferSelect;
export type Exhibition = typeof exhibitions.$inferSelect;
export type NewExhibition = typeof exhibitions.$inferInsert;
export type ExhibitionCategory = typeof exhibitionCategories.$inferSelect;
