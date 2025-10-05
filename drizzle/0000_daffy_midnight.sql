CREATE TABLE "about_content" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(500),
	"content" text,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_content" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(500),
	"description" text,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"image" text,
	"slug" varchar(255) NOT NULL,
	"published_at" timestamp,
	"categories" jsonb,
	"author" varchar(255),
	"status" varchar(50) DEFAULT 'draft',
	"tags" jsonb,
	"hero_images" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "news_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "news_categories" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "news_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "project_categories" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "project_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "project_tabs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"project_id" varchar(255) NOT NULL,
	"tab_order" integer NOT NULL,
	"title" varchar(500) NOT NULL,
	"hero_images" jsonb,
	"hero_image_descriptions" jsonb,
	"hero_image_descriptions_en" jsonb,
	"additional_image" text,
	"project_details" text,
	"technical_sheet" text,
	"title_en" varchar(500),
	"project_details_en" text,
	"technical_sheet_en" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"image" text,
	"year" integer,
	"description" text,
	"slug" varchar(255) NOT NULL,
	"categories" jsonb,
	"tags" jsonb,
	"featured" boolean DEFAULT false,
	"status" varchar(50) DEFAULT 'draft',
	"hero_images" jsonb,
	"hero_image_descriptions" jsonb,
	"hero_image_descriptions_en" jsonb,
	"show_in_home_hero" boolean DEFAULT false,
	"hero_description" text,
	"project_details" text,
	"technical_sheet" text,
	"download_link" text,
	"additional_image" text,
	"commissioned_by" varchar(255),
	"curator" varchar(255),
	"location" varchar(255),
	"title_en" varchar(500),
	"description_en" text,
	"project_details_en" text,
	"technical_sheet_en" text,
	"hero_description_en" text,
	"commissioned_by_en" varchar(255),
	"curator_en" varchar(255),
	"location_en" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "publications" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"thumbnail" text,
	"download_link" text,
	"published_at" timestamp,
	"status" varchar(50) DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "project_tabs" ADD CONSTRAINT "project_tabs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;