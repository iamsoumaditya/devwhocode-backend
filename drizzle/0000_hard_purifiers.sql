CREATE TYPE "public"."role" AS ENUM('lab_assistant', 'admin');--> statement-breakpoint
CREATE TYPE "public"."batch" AS ENUM('X', 'Y');--> statement-breakpoint
CREATE TABLE "lab_assistants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "role" DEFAULT 'lab_assistant',
	"lab_id" integer,
	CONSTRAINT "lab_assistants_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "labs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"sem" integer NOT NULL,
	"roll" text NOT NULL,
	"department_id" uuid,
	"section" integer NOT NULL,
	"batch" "batch" NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "lab_assistants" ADD CONSTRAINT "lab_assistants_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;