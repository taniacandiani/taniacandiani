import { pgTable, varchar, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Projects Table
export const projects = pgTable('projects', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  subtitle: varchar('subtitle', { length: 500 }),
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
  showInHomeHero: boolean('show_in_home_hero').default(false),
  heroDescription: text('hero_description'),

  // Details
  projectDetails: text('project_details'),
  technicalSheet: text('technical_sheet'),
  downloadLink: text('download_link'),
  additionalImage: text('additional_image'),

  // Metadata
  commissionedBy: varchar('commissioned_by', { length: 255 }),
  curator: varchar('curator', { length: 255 }),
  location: varchar('location', { length: 255 }),

  // English translations
  titleEn: varchar('title_en', { length: 500 }),
  subtitleEn: varchar('subtitle_en', { length: 500 }),
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

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Project Categories Table
export const projectCategories = pgTable('project_categories', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  count: integer('count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// News Categories Table
export const newsCategories = pgTable('news_categories', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  count: integer('count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Publications Table
export const publications = pgTable('publications', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  thumbnail: text('thumbnail'),
  downloadLink: text('download_link'),
  publishedAt: timestamp('published_at'),
  status: varchar('status', { length: 50 }).default('draft'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// About Content Table
export const aboutContent = pgTable('about_content', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 500 }),
  content: text('content'),
  lastUpdated: timestamp('last_updated').defaultNow(),
});

// Contact Content Table
export const contactContent = pgTable('contact_content', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 500 }),
  description: text('description'),
  lastUpdated: timestamp('last_updated').defaultNow(),
});

// Export types
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type News = typeof news.$inferSelect;
export type NewNews = typeof news.$inferInsert;
export type ProjectCategory = typeof projectCategories.$inferSelect;
export type NewsCategory = typeof newsCategories.$inferSelect;
export type Publication = typeof publications.$inferSelect;
export type AboutContent = typeof aboutContent.$inferSelect;
export type ContactContent = typeof contactContent.$inferSelect;
