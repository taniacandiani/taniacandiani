CREATE TABLE "exhibition_categories" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_en" varchar(255),
	"description" text,
	"description_en" text,
	"count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "exhibition_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "exhibitions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"image" text,
	"slug" varchar(255) NOT NULL,
	"published_at" timestamp,
	"categories" jsonb,
	"venue" varchar(500),
	"start_date" timestamp,
	"end_date" timestamp,
	"curator" varchar(255),
	"status" varchar(50) DEFAULT 'draft',
	"tags" jsonb,
	"hero_images" jsonb,
	"external_link" text,
	"title_en" varchar(500),
	"content_en" text,
	"venue_en" varchar(500),
	"curator_en" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "exhibitions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "title_en" varchar(500);--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "content_en" text;--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "cv_pdf" text;--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "cv_pdf_en" text;--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "cv_button_text" varchar(100);--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "cv_button_text_en" varchar(100);--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "bio_pdf" text;--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "bio_pdf_en" text;--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "bio_button_text" varchar(100);--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "bio_button_text_en" varchar(100);--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "portfolio_pdf" text;--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "portfolio_pdf_en" text;--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "portfolio_button_text" varchar(100);--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "portfolio_button_text_en" varchar(100);--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "additional_title" varchar(500);--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "additional_title_en" varchar(500);--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "additional_content" text;--> statement-breakpoint
ALTER TABLE "about_content" ADD COLUMN "additional_content_en" text;--> statement-breakpoint
ALTER TABLE "contact_content" ADD COLUMN "title_en" varchar(500);--> statement-breakpoint
ALTER TABLE "contact_content" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "title_en" varchar(500);--> statement-breakpoint
ALTER TABLE "news" ADD COLUMN "content_en" text;--> statement-breakpoint
ALTER TABLE "news_categories" ADD COLUMN "name_en" varchar(255);--> statement-breakpoint
ALTER TABLE "news_categories" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "news_categories" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "project_categories" ADD COLUMN "name_en" varchar(255);--> statement-breakpoint
ALTER TABLE "project_categories" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "project_categories" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "project_tabs" ADD COLUMN "images_without_slider" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "project_tabs" ADD COLUMN "pdf_url" text;--> statement-breakpoint
ALTER TABLE "project_tabs" ADD COLUMN "pdf_title" varchar(500);--> statement-breakpoint
ALTER TABLE "project_tabs" ADD COLUMN "pdf_title_en" varchar(500);--> statement-breakpoint
ALTER TABLE "project_tabs" ADD COLUMN "pdf_button_text" varchar(255);--> statement-breakpoint
ALTER TABLE "project_tabs" ADD COLUMN "pdf_button_text_en" varchar(255);--> statement-breakpoint
ALTER TABLE "project_tabs" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "images_without_slider" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "pdf_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "pdf_button_text" varchar(255);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "pdf_button_text_en" varchar(255);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "title_en" varchar(500);--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "publications" ADD COLUMN "display_order" integer DEFAULT 0;